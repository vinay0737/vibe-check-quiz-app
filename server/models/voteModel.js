import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  vibe: {
    type: String,
    required: [true, "Vibe is required"],
    trim: true,
    enum: ["Happy", "Sad", "Energetic", "Chill", "Angry"], // Example vibes
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index for better query performance
voteSchema.index({ vibe: 1 });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;