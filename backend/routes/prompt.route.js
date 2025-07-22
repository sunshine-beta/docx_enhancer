import express from "express";
import { PromptModel } from "../models/prompt.model.js";

const router = express.Router();

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
