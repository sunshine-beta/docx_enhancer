import mongoose from "mongoose";
import { promptSchema } from "../schemas/prompt.schema.js";

const PromptModel = mongoose.model("Prompt", promptSchema);

export { PromptModel };
