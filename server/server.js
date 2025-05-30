import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import Vote from "./models/voteModel.js"; // Ensure the model is correctly named
import voteRoutes from "./routes/vote.js"; // Import the vote routes

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     credentials: true,
//     methods: ["GET", "POST"],
//   },
// });
const io = new Server(server, {
  cors: {
    origin: "https://vibe-check-quiz-app-ten.vercel.app", // ✅ replace with Vercel URL
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.use(cors({
  origin: "https://vibe-check-quiz-app-ten.vercel.app", // ✅ replace with frontend domain
  credentials: true,
}));
// Middleware
// app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", voteRoutes); // Use the vote routes under /api prefix

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("submitQuiz", async (vibe) => {
    console.log("📥 Received vibe:", vibe);
    try {
      const newVote = new Vote({ vibe });
      await newVote.save();
      console.log("✅ Vote saved:", vibe);

      const vibes = await Vote.find();
      io.emit("vibeUpdate", vibes); // Broadcast updated votes
    } catch (error) {
      console.error("❌ Error saving vote:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected");
  });
});

// Optional route to test if DB connection is working
app.get("/test", async (req, res) => {
  const testVote = new Vote({ vibe: "TestVibe" });
  await testVote.save();
  res.send("Test vote saved!");
});

// Server listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});


