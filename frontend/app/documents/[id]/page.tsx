"use client";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";
import { Question } from "@/types/question";
import { Button } from "@/components/ui/button";
import { useEffect, useState, use } from "react";
import { downloadDocxFromData } from "@/lib/downloadDocx";
import { Packer, Document, Paragraph, TextRun } from "docx";
import { ImproveDialog } from "@/components/improve-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GptResponse {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  references: string[];
}

export default function BatchDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [improveDialogOpen, setImproveDialogOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchQuestions = async () => {
      try {
        const res = await fetch(`http://localhost:4000/documents/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error("Failed to fetch questions");

        if (Array.isArray(data.questions)) {
          setQuestions(data.questions);

          const isProcessing = data.questions.some(
            (q: any) => !q.gptResponse || !q.gptResponse.question,
          );

          if (!isProcessing && interval) clearInterval(interval);
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      }
    };

    fetchQuestions();

    interval = setInterval(fetchQuestions, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const handleImprove = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setImproveDialogOpen(true);
  };

  const handleImproveSuccess = (
    questionId: string,
    newGptResponse: GptResponse,
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._id === questionId ? { ...q, gptResponse: newGptResponse } : q,
      ),
    );
    setImproveDialogOpen(false);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();

    for (const [index, q] of questions.entries()) {
      const gpt =
        typeof q.gptResponse === "string"
          ? JSON.parse(q.gptResponse)
          : q.gptResponse;

      if (!gpt?.question) continue;

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Question ${index + 1}:`,
                    bold: true,
                    size: 28,
                  }),
                  new TextRun("\n"),
                  new TextRun({ text: gpt.question, size: 24 }),
                ],
                spacing: { after: 300 },
              }),
              ...gpt.options.map(
                (option: string, i: number) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${String.fromCharCode(65 + i)}) ${option}`,
                        size: 22,
                      }),
                    ],
                  }),
              ),
              ...(gpt.answer
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Correct Answer: ${gpt.answer}`,
                          bold: true,
                          size: 24,
                        }),
                      ],
                      spacing: { before: 300 },
                    }),
                  ]
                : []),
              ...(gpt.explanation
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Explanation: ${gpt.explanation}`,
                          size: 22,
                        }),
                      ],
                      spacing: { before: 200 },
                    }),
                  ]
                : []),
              ...(gpt.references?.length
                ? [
                    new Paragraph({
                      spacing: { before: 200 },
                      children: [
                        new TextRun({ text: "References:", bold: true }),
                      ],
                    }),
                    ...gpt.references.map(
                      (ref: string) =>
                        new Paragraph({
                          text: `- ${ref}`,
                          spacing: { after: 100 },
                        }),
                    ),
                  ]
                : []),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      zip.file(`question-${index + 1}.docx`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `batch-${id}-questions.zip`);
  };

  const handleDownloadQuestion = (questionId: string) => {
    const q = questions.find((q) => q._id === questionId);
    if (q) downloadDocxFromData([q], `question-${questionId}.docx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processed Questions</h1>
          <p className="text-gray-600">Batch ID: {id}</p>
        </div>
        <Button onClick={handleDownloadAll}>
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>

      <div className="grid gap-6">
        {questions.map((question, index) => {
          let gptData: GptResponse | null = null;

          try {
            gptData =
              typeof question.gptResponse === "string"
                ? JSON.parse(question.gptResponse)
                : question.gptResponse;
          } catch (err) {
            console.warn("Failed to parse gptResponse:", err);
          }

          const correctLetters =
            gptData?.answer
              ?.split("")
              .map((char) => char.trim().toUpperCase())
              .filter((char) => /^[A-E]$/.test(char)) ?? [];

          return (
            <Card key={question._id}>
              <CardHeader>
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!gptData?.question ? (
                  <p className="italic text-muted-foreground">
                    ⏳ Processing with GPT...
                  </p>
                ) : (
                  <>
                    <div>
                      <p className="whitespace-pre-line font-medium">
                        {gptData.question}
                      </p>
                    </div>

                    {Array.isArray(gptData.options) &&
                      gptData.options.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Options:</p>
                          {gptData.options.map((choice, choiceIndex) => {
                            const choiceLetter = String.fromCharCode(
                              65 + choiceIndex,
                            );
                            return (
                              <div
                                key={choiceIndex}
                                className="rounded-lg border bg-gray-50 p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="self-start font-medium">
                                    {choiceLetter}.
                                  </span>
                                  <span>{choice}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    {correctLetters.length > 0 && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="mb-1 text-sm font-semibold text-green-900">
                          Correct Answer:
                        </p>
                        <p className="text-sm text-green-800">
                          {correctLetters.join(", ")}
                        </p>
                      </div>
                    )}

                    {gptData.explanation && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="mb-1 text-sm font-semibold text-blue-900">
                          Explanation:
                        </p>
                        <p className="whitespace-pre-line text-sm text-blue-800">
                          {gptData.explanation}
                        </p>
                      </div>
                    )}

                    {Array.isArray(gptData.references) &&
                      gptData.references.length > 0 &&
                      gptData.references.some((r) => !!r && r !== "None") && (
                        <div className="rounded-lg bg-yellow-50 p-3">
                          <p className="mb-1 text-sm font-semibold text-yellow-900">
                            References:
                          </p>
                          <ul className="list-inside list-disc text-sm text-yellow-800">
                            {gptData.references.map(
                              (ref, idx) =>
                                ref &&
                                ref !== "None" && (
                                  <li key={idx}>
                                    <a
                                      href={ref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                    >
                                      {ref}
                                    </a>
                                  </li>
                                ),
                            )}
                          </ul>
                        </div>
                      )}
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleImprove(question._id)}
                  >
                    Improve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadQuestion(question._id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ImproveDialog
        open={improveDialogOpen}
        onOpenChange={setImproveDialogOpen}
        questionId={selectedQuestionId}
        onImproveSuccess={handleImproveSuccess}
      />
    </div>
  );
}
