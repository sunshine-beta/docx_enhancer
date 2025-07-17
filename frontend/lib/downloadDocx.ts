import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import { Question } from "@/types/question";

export async function downloadDocxFromData(
  questions: Question[],
  fileName: string,
): Promise<void> {
  const doc = new Document({
    sections: [
      {
        children: questions.flatMap((q, idx) => {
          const content: Paragraph[] = [];

          // Parse GPT response safely
          const gpt =
            typeof q.gptResponse === "string"
              ? JSON.parse(q.gptResponse)
              : q.gptResponse;

          // Question Title
          content.push(
            new Paragraph({
              text: `Question ${idx + 1}`,
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 150 },
            }),
          );

          // Question Text
          content.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: gpt?.question || q.question,
                  bold: true,
                  size: 28, // 14pt
                }),
              ],
              spacing: { after: 200 },
            }),
          );

          // Options
          gpt?.options?.forEach((option: string, i: number) => {
            const letter = String.fromCharCode(65 + i);
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${letter}) `,
                    bold: true,
                  }),
                  new TextRun({
                    text: option,
                  }),
                ],
                spacing: { after: 100 },
              }),
            );
          });

          // Correct Answer
          if (gpt?.answer || q.correctAnswerRaw) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Correct Answer: `,
                    bold: true,
                  }),
                  new TextRun(gpt?.answer || q.correctAnswerRaw),
                ],
                spacing: { after: 150 },
              }),
            );
          }

          // Explanation
          if (gpt?.explanation || q.explanation) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Explanation:\n`,
                    bold: true,
                  }),
                  new TextRun(gpt?.explanation || q.explanation),
                ],
                spacing: { after: 150 },
              }),
            );
          }

          // References
          const refs: string[] = Array.isArray(gpt?.references)
            ? gpt.references
            : Array.isArray(q.references)
              ? q.references
              : [];
          if (refs.length > 0 && refs.some((r) => r && r !== "None")) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "References:",
                    bold: true,
                  }),
                ],
                spacing: { after: 100 },
              }),
            );

            refs.forEach((ref: string) => {
              if (ref && ref !== "None") {
                content.push(
                  new Paragraph({
                    children: [new TextRun({ text: `• ${ref}` })],
                    bullet: { level: 0 },
                    spacing: { after: 100 },
                  }),
                );
              }
            });
          }

          // Spacer between questions
          content.push(new Paragraph({ text: "", spacing: { after: 400 } }));

          return content;
        }),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}
