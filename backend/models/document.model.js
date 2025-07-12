import mongoose from "mongoose";
import { documentSchema } from "../schemas/document.schema.js";

const DocumentModel = mongoose.model("Document", documentSchema);

export { DocumentModel };
