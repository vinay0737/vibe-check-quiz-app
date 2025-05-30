import express from "express";
import Vote from "../models/Vote.js";

const router = express.Router();

// Submit a vote
router.post("/vote", async (req, res) => {
  const { vibe } = req.body;
  try {
    const vote = new Vote({ vibe });
    await vote.save();
    res.status(200).json({ message: "Vote recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vote distribution
router.get("/results", async (req, res) => {
  try {
    const votes = await Vote.find();
    const counts = votes.reduce((acc, vote) => {
      acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
      return acc;
    }, {});
    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;