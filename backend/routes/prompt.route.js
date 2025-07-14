import express from "express";
import { PromptModel } from "../models/prompt.model.js";

const router = express.Router();

const defaultPrompt = `You are provided with a full MSRA SJT case (scenario, options, answer, explanation). Rewrite it into a fully original academic case study using formal academic British English. Maintain the ethical principle.

Your output must follow this structure exactly:

Question
<Rewritten academic scenario>

Options
<Option 1>
<Option 2>
<Option 3>
<Option 4>
<Option 5>

Answer
A, D, C, B, E  ← Provide only capital letters in the correct ranked order

Explanation
<Formal explanation in academic tone>

References
• GMC Good Medical Practice 2024 (PDF)
• The Health Foundation – New Medical Professionalism (PDF)
• University of Central Lancashire – Medical Professionalism (PDF)

Important notes:
- Do NOT prefix options with A), B), 1., etc. — just list them plainly
- The answer must be a **ranked list of letters** (A–E), nothing else
- If the prompt doesn’t include a references section, always include the three default ones above
- Use clear, professional British English — no informal or casual language`;

router.get("/", async (_, res) => {
  try {
    const latest = await PromptModel.findOne().sort({ updatedAt: -1 });
    if (!latest) {
      console.log("No custom prompt found, returning default");
      return res.json({ content: defaultPrompt });
    }
    return res.json({ content: latest.content });
  } catch (err) {
    console.error("Failed to fetch prompt:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const { content } = req.body;
  if (!content)
    return res.status(400).json({ message: "Prompt content missing" });

  try {
    const prompt = new PromptModel({ content });
    await prompt.save();
    return res.status(201).json(prompt);
  } catch (err) {
    console.error("Failed to save prompt:", err);
    return res.status(500).json({ message: "Failed to save prompt" });
  }
});

export { router };
