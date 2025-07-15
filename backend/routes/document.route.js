import express, { response } from "express";
import multer from "multer";
import mongoose from "mongoose";
import { DocumentModel } from "../models/document.model.js";
import { parseXlsxRows } from "../utils/praseXlsxRows.js";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ASSISTANT_ID = process.env.ASSISTANT_ID;

function generateQuestionDocx(question) {
  const {
    question: qText,
    options,
    correctAnswerRaw,
    explanation,
    references,
  } = question;

  const text = `
    Question: ${qText}\n
    A) ${options[0] || ""}\n
    B) ${options[1] || ""}\n
    C) ${options[2] || ""}\n
    D) ${options[3] || ""}\n
    Correct Answer: ${correctAnswerRaw || ""}\n
    Explanation: ${explanation || ""}\n
    References: ${(references || []).join(", ")}
  `;
  return Buffer.from(text, "utf-8");
}

async function runAssistant(messageText) {
  const run = await openai.beta.threads.createAndRun({
    assistant_id: ASSISTANT_ID,
    thread: { messages: [{ role: "user", content: messageText }] },
  });
  const responseText = await pollUntilComplete(run.thread_id, run.id);
  console.log("GPT-4o-mini Reponse:", responseText);
  return responseText;
}

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

async function processQuestionsAsync(docId, promptTemplate) {
  const doc = await DocumentModel.findById(docId);
  if (!doc) return;

  const questions = doc.questions;
  const batchSize = 50;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const customPrompt = promptTemplate
      .replace("[Your question here]", q.question)
      .replace("[Choice A]", q.options[0] || "")
      .replace("[Choice B]", q.options[1] || "")
      .replace("[Choice C]", q.options[2] || "")
      .replace("[Choice D]", q.options[3] || "")
      .replace("[Letter]", q.correctAnswerRaw)
      .replace("[Detailed explanation]", q.explanation || "")
      .replace(
        "references: []",
        `references: ${JSON.stringify(q.references || [])}`
      );

    try {
      const result = await runAssistant(customPrompt);

      try {
        const parsed = JSON.parse(result);

        // 🛠 Fix GPT typo: "referrences" → "references"
        if (!parsed.references && parsed.referrences) {
          parsed.references = parsed.referrences;
          delete parsed.referrences;
        }

        // 📋 Ensure references is always an array of strings
        if (parsed.references && typeof parsed.references === "string") {
          parsed.references = parsed.references
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean);
        }

        // ✅ Store the cleaned-up response
        questions[i].gptResponse = parsed;
      } catch (parseErr) {
        console.error("❌ JSON parse failed:", parseErr);
        questions[i].gptResponse = {
          error: "Failed to parse GPT response",
          raw: result,
        };
      }
    } catch (err) {
      console.error("❌ GPT failed:", err);
      questions[i].gptResponse = {
        error: "Failed to generate GPT response",
      };
    }

    if ((i + 1) % batchSize === 0) {
      console.log(
        `✅ Processed ${i + 1} questions. Waiting before next batch...`
      );
      await doc.save();
      await delay(15000);
    }
  }

  doc.status = "completed";
  await doc.save();
}

router.post("/upload", upload.single("file"), async (req, res) => {
  console.log("/upload endpoint hit");

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt missing" });

    const parsed = parseXlsxRows(req.file.buffer);
    if (!parsed.length) {
      return res.status(400).json({ message: "No data found in file" });
    }

    const doc = await DocumentModel.create({
      filename: req.file.originalname,
      questions: parsed.map((q) => ({
        ...q,
        gptResponse: null,
      })),
      status: "processing",
    });

    processQuestionsAsync(doc._id, prompt);
    res.status(201).json(doc);
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

router.get("/:docId/questions/:qId/download", async (req, res) => {
  const { qId } = req.params;
  const doc = await DocumentModel.findById(req.params.docId);
  const question = doc.questions.id(qId);
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
