import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  vibe: {
    type: String,
    required: true,
  },
});

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;


