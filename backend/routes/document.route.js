import express from "express";
import multer from "multer";
import mammoth from "mammoth";
import mongoose from "mongoose";
import { DocumentModel } from "../models/document.model.js";
import { parseQuestions } from "../utils/parseQuestion.js";
import { OpenAI } from "openai";
import dotenv from "dotenv";

// setup dotenv package to use environment variables
dotenv.config();

// Intialize router
const router = express.Router();

// multer for uploading files in memory
const upload = multer({ storage: multer.memoryStorage() });

// setup openai API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// setup assistant ID
const ASSISTANT_ID = process.env.ASSISTANT_ID;

// run assistant function
async function runAssistant(messageText) {
  const run = await openai.beta.threads.createAndRun({
    assistant_id: ASSISTANT_ID,
    thread: { messages: [{ role: "user", content: messageText }] },
  });
  return pollUntilComplete(run.thread_id, run.id);
}

// Polling the data
async function pollUntilComplete(threadId, runId) {
  while (true) {
    const r = await openai.beta.threads.runs.retrieve(runId, {
      thread_id: threadId,
    });
    if (r.status === "completed") {
      const msgs = await openai.beta.threads.messages.list(threadId);
      return msgs.data
        .filter((m) => m.role === "assistant")
        .flatMap((m) =>
          m.content.filter((c) => c.type === "text").map((c) => c.text.value)
        )
        .join("\n");
    }
    if (r.status === "failed") throw new Error("Assistant run failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function processQuestionsAsync(docId) {
  const doc = await DocumentModel.findById(docId);
  if (!doc) return;

  for (let i = 0; i < doc.questions.length; i++) {
    const q = doc.questions[i];

    const prompt = `Please rewrite the following MSRA case…\n\n${
      q.question
    }\nOptions:\n${q.choices
      .map((c, j) => `${String.fromCharCode(65 + j)}. ${c}`)
      .join("\n")}\nAnswer: ${q.correctAnswerRaw}\nExplanation: ${
      q.explanation
    }\nReferences:\n${q.references.map((r) => `• ${r}`).join("\n")}`;

    try {
      const rewritten = await runAssistant(prompt);
      doc.questions[i].rewritten = rewritten;
      doc.questions[i].status = "completed";
    } catch (err) {
      console.error("❌ Failed to rewrite question:", err);
      doc.questions[i].status = "failed";
    }
  }

  doc.status = "completed";
  await doc.save();
}

// POST /upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const text = (await mammoth.extractRawText({ buffer: req.file.buffer }))
      .value;
    const parsed = parseQuestions(text);

    // Save document with "pending" questions
    const doc = await DocumentModel.create({
      filename: req.file.originalname,
      questions: parsed.map((q) => ({
        question: q.question,
        choices: q.choices,
        correctAnswerRaw: q.correctAnswerRaw,
        explanation: q.explanation,
        references: q.references,
        rewritten: "",
      })),
    });

    // Respond quickly
    res.status(201).json(doc);

    // Start background processing after response
    processQuestionsAsync(doc._id);
  } catch (err) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

router.get("/", async (_, res) => {
  const docs = await DocumentModel.find().sort({ date: -1 });
  res.json(docs);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  const doc = await DocumentModel.findById(id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
});

// Downloading cards .docx file
router.get("/:docId/questions/:qId/download", async (req, res) => {
  const doc = await DocumentModel.findById(req.params.docId);
  const question = doc.questions.id(req.params.qId);
  if (!question) return res.status(404).send("Not found");

  const docxBuf = await generateQuestionDocx(question);
  res.set({
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename=question-${qId}.docx`,
  });
  res.send(docxBuf);
});

export { router };
