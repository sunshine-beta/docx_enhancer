import multer from "multer";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { OpenAI } from "openai";
import { PromptModel } from "../models/prompt.model.js";
import { parseXlsxRows } from "../utils/praseXlsxRows.js";
import { DocumentModel } from "../models/document.model.js";

// set-up environment variables
dotenv.config();

// Initialize router
const router = express.Router();

// multer to upload file on memoryStorage
const upload = multer({ storage: multer.memoryStorage() });

// openai API_KEY initialized
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// const ASSISTNAT_ID initialized
const ASSISTANT_ID = process.env.ASSISTANT_ID;

function extractAnswerFromText(text) {
  console.log("🔍 Extracting answer from text:\n", text);

  // Look for common patterns
  const correctAnswerMatch = text.match(
    /Correct Answer[:\-]?\s*([A-E](?:[\s,]+[A-E])*)/i
  );
  if (correctAnswerMatch) {
    console.log("✅ Found Correct Answer line:", correctAnswerMatch[1]);
    return correctAnswerMatch[1]
      .split(/[\s,]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-E]$/.test(c))
      .join(", ");
  }

  // Try from explanation brackets: (D), (C), ...
  const bracketMatches = [...text.matchAll(/\(([A-E])\)/gi)];
  const letters = bracketMatches.map((m) => m[1].toUpperCase());

  if (letters.length > 0) {
    console.log("✅ Extracted from brackets:", letters);
    return [...new Set(letters)].join(", "); // Remove duplicates, preserve order
  }

  console.warn("❌ Could not extract answer from text.");
  return "";
}

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

function buildPromptFromTemplate(promptTemplate, question) {
  const {
    question: qText = "",
    options = [],
    correctAnswerRaw = "",
    explanation = "",
    references = [],
  } = question;

  return promptTemplate
    .replace("[Your question here]", qText)
    .replace("[Choice A]", options[0] || "")
    .replace("[Choice B]", options[1] || "")
    .replace("[Choice C]", options[2] || "")
    .replace("[Choice D]", options[3] || "")
    .replace("[Letter]", correctAnswerRaw)
    .replace("[Detailed explanation]", explanation)
    .replace("references: []", `references: ${JSON.stringify(references)}`);
}

async function runAssistant(messageText) {
  const run = await openai.beta.threads.createAndRun({
    assistant_id: ASSISTANT_ID,
    thread: { messages: [{ role: "user", content: messageText }] },
  });
  const responseText = await pollUntilComplete(run.thread_id, run.id);
  console.log("GPT-4o-mini Response:", responseText);
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
  const batchSize = 10;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const processBatch = async (batch, startIndex) => {
    const promises = batch.map(async (q, idx) => {
      const index = startIndex + idx;
      const customPrompt = buildPromptFromTemplate(promptTemplate, q);

      try {
        const result = await runAssistant(customPrompt);
        let parsed;

        try {
          parsed = JSON.parse(result);

          if (!parsed || typeof parsed !== "object" || !parsed.question) {
            throw new Error("GPT response missing expected fields");
          }

          console.log("🧠 Raw GPT JSON:", parsed);

          const answerSource = parsed.answer || parsed.Answer || ""; // Cover capitalized fields too
          const explanationText =
            parsed.explanation || parsed.Explanation || "";

          let extractedAnswer = answerSource.trim();
          if (!extractedAnswer) {
            console.log("🔎 Answer missing — extracting from explanation");
            extractedAnswer = extractAnswerFromText(explanationText);
            if (!extractedAnswer) {
              console.log(
                "🔎 Still missing — fallback to full GPT response text"
              );
              extractedAnswer = extractAnswerFromText(result); // fallback to full raw GPT response
            }
          }

          parsed.answer = extractedAnswer;

          if (!parsed.references && parsed.referrences) {
            parsed.references = parsed.referrences;
            delete parsed.referrences;
          }

          if (parsed.references && typeof parsed.references === "string") {
            parsed.references = parsed.references
              .split("\n")
              .map((r) => r.trim())
              .filter(Boolean);
          }

          questions[index].gptResponse = parsed;
          console.log(
            `✅ Final parsed answer for Q${index + 1}:`,
            parsed.answer
          );
        } catch (parseErr) {
          questions[index].gptResponse = {
            error: parseErr.message || "Failed to parse GPT response",
            raw: result,
          };
        }
      } catch (err) {
        questions[index].gptResponse = {
          error: "Failed to generate GPT response",
        };
      }
    });

    await Promise.allSettled(promises);
    await doc.save(); // Save progress after each batch
  };

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    await processBatch(batch, i);
    console.log(`✅ Processed batch ${i}–${i + batch.length}`);
    await delay(3000);
  }

  doc.status = "completed";
  await doc.save();
}

router.post("/improve-question", async (req, res) => {
  const { questionId, improvementPrompt } = req.body;

  if (!questionId || !improvementPrompt) {
    return res.status(400).json({ message: "Missing questionId or prompt" });
  }

  try {
    const doc = await DocumentModel.findOne({ "questions._id": questionId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const question = doc.questions.id(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    const latestPrompt = await PromptModel.findOne().sort({ updatedAt: -1 });
    const promptTemplate =
      latestPrompt?.content || "You are provided with a full MSRA SJT case...";

    const basePrompt = buildPromptFromTemplate(promptTemplate, question);

    const finalPrompt = `${basePrompt}

---
User Feedback for Improvement:
${improvementPrompt}`.trim();

    const gptResponse = await runAssistant(finalPrompt);

    let parsed;
    try {
      parsed = JSON.parse(gptResponse);

      if (!parsed || typeof parsed !== "object" || !parsed.question) {
        return res.status(400).json({
          message: "GPT response missing expected fields",
          raw: parsed,
        });
      }

      question.gptResponse = parsed;
      await doc.save();

      res.json({ rewrittenText: parsed.question || "" });
    } catch (err) {
      console.error("GPT response not JSON:", gptResponse);
      return res.status(500).json({
        message: "Failed to parse GPT response",
        raw: gptResponse,
      });
    }
  } catch (err) {
    console.error("Error improving question:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

// File upload route
router.post("/upload", upload.single("file"), async (req, res) => {
  console.log("/upload endpoint hit");

  const {
    body: { prompt: incomingPrompt },
    file,
  } = req;

  try {
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let prompt = incomingPrompt;
    if (!prompt) {
      const latestPrompt = await PromptModel.findOne().sort({ updatedAt: -1 });
      prompt =
        latestPrompt?.content ||
        `You are provided with a full MSRA SJT case (scenario, options, answer, explanation) & references`;
    }

    const parsed = parseXlsxRows(file.buffer);
    if (!parsed.length) {
      return res.status(400).json({ message: "No data found in file" });
    }

    const doc = await DocumentModel.create({
      filename: file.originalname,
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
