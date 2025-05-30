import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  vibe: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("Vote", voteSchema);
