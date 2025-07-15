"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadDocxFromData } from "@/lib/downloadDocx";
import { ImproveDialog } from "@/components/improve-dialog";
import { Download } from "lucide-react";
import { Question } from "@/types/question";

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
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`http://localhost:4000/documents/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error("Failed to fetch questions");

        if (Array.isArray(data.questions)) {
          setQuestions(data.questions);
        } else {
          console.warn("Invalid questions array:", data);
          setQuestions([]);
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      }
    };

    fetchQuestions();
  }, [id]);

  const handleImprove = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setImproveDialogOpen(true);
  };

  const handleImproveSuccess = (questionId: string, rewrittenText: string) => {
    const updated = questions.map((q) =>
      q._id === questionId
        ? { ...q, rewritten: rewrittenText, status: "completed" }
        : q
    );
    setQuestions(updated);
    setImproveDialogOpen(false);
  };

  const handleDownloadAll = () => {
    downloadDocxFromData(questions, `all-questions-batch-${id}.docx`);
  };

  const handleDownloadQuestion = (questionId: string) => {
    const q = questions.find((q) => q._id === questionId);
    if (q) downloadDocxFromData([q], `question-${questionId}.docx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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
          let gptData: {
            question: string;
            options: string[];
            answer: string;
            explanation: string;
            references: string[];
          } | null = null;

          try {
            gptData =
              typeof question.gptResponse === "string"
                ? JSON.parse(question.gptResponse)
                : question.gptResponse;
          } catch (err) {
            console.warn("Failed to parse gptResponse:", err);
          }

          const correctLetters = gptData?.answer?.split("") ?? [];

          return (
            <Card key={question._id}>
              <CardHeader>
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Text */}
                <div>
                  <p className="font-medium whitespace-pre-line">
                    {gptData?.question || question.question}
                  </p>
                </div>

                {/* Options */}
                {Array.isArray(gptData?.options) &&
                  gptData.options.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Options:</p>
                      {gptData.options.map((choice, choiceIndex) => {
                        const choiceLetter = String.fromCharCode(
                          65 + choiceIndex
                        );
                        return (
                          <div
                            key={choiceIndex}
                            className="p-3 rounded-lg border bg-gray-50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium self-start">
                                {choiceLetter}.
                              </span>
                              <span>{choice}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Correct Answer */}
                {correctLetters.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-900 mb-1">
                      Correct Answer:
                    </p>
                    <p className="text-green-800 text-sm">
                      {correctLetters.map((letter) => `${letter}`).join(", ")}
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {gptData?.explanation && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Explanation:
                    </p>
                    <p className="text-sm text-blue-800 whitespace-pre-line">
                      {gptData.explanation}
                    </p>
                  </div>
                )}

                {/* References */}
                {Array.isArray(gptData?.references) &&
                  gptData.references.length > 0 &&
                  gptData.references.some((r) => !!r && r !== "None") && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                        References:
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-800">
                        {gptData.references.map((ref, idx) =>
                          ref && ref !== "None" ? (
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
                          ) : null
                        )}
                      </ul>
                    </div>
                  )}

                {/* Actions */}
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
