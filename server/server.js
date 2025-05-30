import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import voteRouter from "./routes/vote.js"; // Add this import

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enhanced Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the vote router
app.use("/api", voteRouter); // Add this line

// MongoDB connection with enhanced options
// MongoDB connection
const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Socket.IO setup with production config
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
});

// Socket.IO logic with error handling
io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("submitQuiz", async (vibe) => {
    if (!vibe) {
      return socket.emit("error", "Vibe is required");
    }
    
    console.log("📥 Received vibe:", vibe);
    try {
      const newVote = new Vote({ vibe });
      await newVote.save();
      console.log("✅ Vote saved:", vibe);

      const votes = await Vote.find();
      const counts = votes.reduce((acc, vote) => {
        acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
        return acc;
      }, {});
      
      io.emit("vibeUpdate", counts);
    } catch (error) {
      console.error("❌ Error saving vote:", error.message);
      socket.emit("error", "Failed to save vote");
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected");
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Server start with graceful shutdown
const PORT = process.env.PORT || 5000;
const runningServer = server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully");
  runningServer.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});