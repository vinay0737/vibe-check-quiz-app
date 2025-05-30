import express from "express";
import Vote from "../models/voteModel.js";

const router = express.Router();

// Submit a vote
router.post("/vote", async (req, res) => {
  const { vibe } = req.body;
  
  if (!vibe) {
    return res.status(400).json({ error: "Vibe is required" });
  }

  try {
    const vote = new Vote({ vibe });
    await vote.save();
    
    // Get updated counts
    const votes = await Vote.find();
    const counts = votes.reduce((acc, vote) => {
      acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
      return acc;
    }, {});
    
    res.status(200).json({ 
      message: "Vote recorded",
      counts 
    });
  } catch (err) {
    console.error("Error saving vote:", err);
    res.status(500).json({ error: "Failed to save vote" });
  }
});

// Get vote distribution with caching headers
router.get("/results", async (req, res) => {
  try {
    const votes = await Vote.find().lean();
    const counts = votes.reduce((acc, vote) => {
      acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
      return acc;
    }, {});
    
    // Add caching headers for production
    res.set('Cache-Control', 'public, max-age=30');
    res.json(counts);
  } catch (err) {
    console.error("Error fetching results:", err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;