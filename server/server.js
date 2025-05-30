import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import voteRouter from "./routes/vote.js";
import Vote from "./models/voteModel.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "https://vibe-check-quiz-app-ten.vercel.app", // Your deployed frontend URL
  "http://localhost:3000",                      // Your local React dev server
  "http://localhost:3001",                      // Another local port used by frontend
];

// CORS middleware for Express
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. Postman) or from allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl} from origin: ${req.headers.origin}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", voteRouter);

// Connect MongoDB using MONGO_URI env var
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Setup Socket.IO with matching CORS options
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS (Socket.IO)"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
  // Optional: state recovery, adjust as needed
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

io.on("connection", (socket) => {
  console.log("⚡️ A user connected via Socket.IO");

  socket.on("submitQuiz", async (vibe) => {
    if (!vibe) {
      return socket.emit("error", "Vibe is required");
    }

    console.log("📥 Received vibe via socket:", vibe);

    try {
      const newVote = new Vote({ vibe });
      await newVote.save();
      console.log("✅ Vote saved:", vibe);

      const votes = await Vote.find();
      const counts = votes.reduce((acc, vote) => {
        acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
        return acc;
      }, {});

      // Emit updated counts to all connected clients
      io.emit("vibeUpdate", counts);
    } catch (error) {
      console.error("❌ Error saving vote (socket):", error.message);
      socket.emit("error", "Failed to save vote");
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected from socket");
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
const runningServer = server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully");
  runningServer.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});