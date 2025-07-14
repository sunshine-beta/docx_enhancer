import mongoose from "mongoose";

const promptSchema = new mongoose.Schema({
  content: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export { promptSchema };
