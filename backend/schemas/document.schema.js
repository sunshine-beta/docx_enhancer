import mongoose from "mongoose";
import { questionSchema } from "./question.schema.js";

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "processing",
  },
  date: {
    type: String,
    default: () => new Date().toDateString(),
  },
  questions: [questionSchema],
});

export { documentSchema };
