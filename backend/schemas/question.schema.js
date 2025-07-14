import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswerRaw: { type: String },
  explanation: { type: String },
  references: { type: [String] },
  gptResponse: { type: mongoose.Schema.Types.Mixed, default: null },
});

export { questionSchema };
