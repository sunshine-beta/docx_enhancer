import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  choices: { type: [String], required: true },
  correctAnswerRaw: { type: String },
  explanation: { type: String },
  references: { type: [String] },
});

export { questionSchema };
