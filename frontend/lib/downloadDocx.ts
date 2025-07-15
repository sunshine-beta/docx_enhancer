import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Question } from "@/types/question";

export async function downloadDocxFromData(
  questions: Question[],
  fileName: string
): Promise<void> {
  const doc = new Document({
    sections: [
      {
        children: questions.flatMap((q, idx) => {
          const content: Paragraph[] = [];

          // Safely handle gptResponse object
          const gpt =
            typeof q.gptResponse === "string"
              ? JSON.parse(q.gptResponse)
              : q.gptResponse;

          content.push(
            new Paragraph({
              children: [
                new TextRun({ text: `Question ${idx + 1}:`, bold: true }),
                new TextRun("\n"),
                new TextRun(gpt?.question || q.question),
              ],
              spacing: { after: 200 },
            })
          );

          gpt?.options?.forEach((option: string, i: number) => {
            const letter = String.fromCharCode(65 + i);
            content.push(new Paragraph(`${letter}) ${option}`));
          });

          if (gpt?.answer || q.correctAnswerRaw) {
            content.push(
              new Paragraph(
                `Correct Answer: ${gpt?.answer || q.correctAnswerRaw}`
              )
            );
          }

          if (gpt?.explanation || q.explanation) {
            content.push(
              new Paragraph(`Explanation: ${gpt?.explanation || q.explanation}`)
            );
          }

          if (gpt?.references?.length || q.references?.length) {
            const refs = gpt?.references ?? q.references ?? [];

            content.push(new Paragraph("References:"));
            refs.forEach((ref: string) => {
              if (ref && ref !== "None") {
                content.push(new Paragraph(`- ${ref}`));
              }
            });
          }

          content.push(new Paragraph("")); // Spacer
          return content;
        }),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}
