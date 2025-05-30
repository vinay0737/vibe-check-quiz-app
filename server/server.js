import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import voteRouter from "./routes/vote.js";
import Vote from "./models/voteModel.js"; // 🔥 Required for socket.io

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ CORS setup for frontend hosted on Vercel
app.use(cors({
  origin: process.env.CLIENT_URL || "https://vibe-check-quiz-app-ten.vercel.app",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API routes
app.use("/api", voteRouter);

// ✅ MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "https://vibe-check-quiz-app-ten.vercel.app",
    credentials: true,
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// ✅ Socket.IO logic
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

// ✅ Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
const runningServer = server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// ✅ Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully");
  runningServer.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});
