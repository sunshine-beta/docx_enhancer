"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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

export default function PromptPage() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // ✅ Load the latest prompt from backend on mount
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await fetch("http://localhost:4000/prompt");
        if (!res.ok) throw new Error("Failed to fetch prompt");
        const data = await res.json();
        setPrompt(data.content || defaultPrompt); // fallback to default if empty
      } catch (err) {
        console.warn("⚠️ Using default prompt due to fetch failure:", err);
        setPrompt(defaultPrompt);
      }
    };

    fetchPrompt();
  }, []);

  const handleUpdatePrompt = async () => {
    setIsUpdating(true);
    setUpdateSuccess(false);

    await fetch("http://localhost:4000/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: prompt }), // ✅ key must be "content"
    });

    setTimeout(() => {
      setIsUpdating(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GPT Prompt Settings</h1>
        <p className="text-gray-600">
          Configure the prompt template used for question generation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Template</CardTitle>
          <CardDescription>
            This prompt will be used by GPT to generate questions from uploaded
            documents. Modify it to customize the question generation behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="prompt">Prompt Template</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isUpdating}
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleUpdatePrompt}
              disabled={isUpdating || !prompt.trim()}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Prompt
            </Button>

            {updateSuccess && (
              <p className="text-sm text-green-600 font-medium">
                Prompt updated successfully!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips for Effective Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Be specific about the question format and structure</li>
            <li>• Include clear instructions for answer choices</li>
            <li>• Specify the number of questions to generate</li>
            <li>• Request explanations for correct answers</li>
            <li>• Consider the target audience and difficulty level</li>
            <li>• Use examples when possible to guide the AI</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
