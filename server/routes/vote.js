import express from "express";
import Vote from "../models/voteModel.js";

const router = express.Router();

// POST /api/vote
router.post("/vote", async (req, res) => {
  console.log("📩 Received POST /api/vote request from frontend");

  const { vibe } = req.body;

  if (!vibe) {
    return res.status(400).json({ error: "Vibe is required" });
  }

  try {
    const vote = new Vote({ vibe });
    await vote.save();

    const votes = await Vote.find();
    const counts = votes.reduce((acc, vote) => {
      acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      message: "Vote recorded",
      counts,
    });
  } catch (err) {
    console.error("❌ Error saving vote:", err);
    res.status(500).json({ error: "Failed to save vote" });
  }
});

// GET /api/results
router.get("/results", async (req, res) => {
  console.log("📊 Received GET /api/results request from frontend");

  try {
    const votes = await Vote.find().lean();
    const counts = votes.reduce((acc, vote) => {
      acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
      return acc;
    }, {});

    res.set("Cache-Control", "public, max-age=30");
    res.json(counts);
  } catch (err) {
    console.error("❌ Error fetching results:", err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;