// utils/parseQuestions.js

export function parseQuestions(docText) {
  // Split raw text into blocks by "Question 1", "Question 2", etc.
  const questionBlocks = docText
    .split(/Question\s+\d+/gi)
    .slice(1) // skip the intro/heading block
    .map((q) => q.trim())
    .filter(Boolean);

  const parsedQuestions = questionBlocks.map((block) => {
    // Match the answer line like: Answer: C, B, D, A, E
    const answerMatch = block.match(/Answer:\s*(.+)/i);

    // Match the explanation section
    const explanationMatch = block.match(
      /Explanation:\s*([\s\S]*?)(?=References:|$)/i
    );

    // Match the references section
    const referencesMatch = block.match(/References:\s*([\s\S]*)/i);

    // Extract all MCQ-style choices (lines starting with A. / B) / • etc.)
    const choices = Array.from(
      block.matchAll(/^\s*(?:[A-Ea-e][\).]|•)\s*(.+)$/gm)
    ).map((m) => m[1].trim());

    // Remove the choice lines, answer, explanation, and references from question
    const questionText = block
      .replace(/^\s*(?:[A-Ea-e][\).]|•)\s*.+$/gm, "") // remove choices
      .replace(/Answer:.*/i, "")
      .replace(/Explanation:.*/i, "")
      .replace(/References:.*/i, "")
      .trim();

    return {
      question: questionText,
      choices: choices.length ? choices : [], // ensure array, not null
      correctAnswerRaw: answerMatch?.[1]?.split(",")[0]?.trim() || "", // just the first letter
      explanation: explanationMatch?.[1]?.trim() || "",
      references: referencesMatch
        ? referencesMatch[1]
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean)
        : [],
    };
  });

  return parsedQuestions;
}
