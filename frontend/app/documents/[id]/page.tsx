"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImproveDialog } from "@/components/improve-dialog";
import { Download } from "lucide-react";

interface Question {
  _id: string;
  question: string;
  choices: string[];
  correctAnswerRaw?: string;
  explanation?: string;
  references?: string[];
  rewritten?: string;
  status: string;
}

export default function BatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [improveDialogOpen, setImproveDialogOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");

  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await fetch(`http://localhost:4000/documents/${params.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error("Response Error fetching cards");
      }

      if (Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        console.warn("No questions array in response:", data);
        setQuestions([]);
      }
    };
    fetchQuestions();
  }, [params.id]);

  const handleImprove = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setImproveDialogOpen(true);
  };

  const handleImproveSuccess = (questionId: string, rewrittenText: string) => {
    const updatedQuestions = questions.map((q) =>
      q._id === questionId
        ? { ...q, rewritten: rewrittenText, status: "completed" }
        : q
    );
    setQuestions(updatedQuestions);
    setImproveDialogOpen(false);
  };

  const handleDownloadQuestion = (questionId: string) => {
    const link = document.createElement("a");
    link.href = "#";
    link.download = `question-${questionId}.docx`;
    link.click();
  };

  const handleDownloadAll = () => {
    const link = document.createElement("a");
    link.href = "#";
    link.download = `all-questions-batch-${params.id}.zip`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Processed Questions</h1>
          <p className="text-gray-600">Batch ID: {params.id}</p>
        </div>
        <Button onClick={handleDownloadAll}>
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>

      <div className="grid gap-6">
        {questions.map((question, index) => (
          <Card key={question._id}>
            <CardHeader>
              <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-medium whitespace-pre-line">
                {question.question}
              </p>

              <div className="space-y-2">
                {question.choices?.map((choice, choiceIndex) => (
                  <div
                    key={choiceIndex}
                    className={`p-3 rounded-lg border ${
                      question.correctAnswerRaw?.includes(
                        String.fromCharCode(65 + choiceIndex)
                      )
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {String.fromCharCode(65 + choiceIndex)}.
                      </span>
                      <span>{choice}</span>
                      {question.correctAnswerRaw?.includes(
                        String.fromCharCode(65 + choiceIndex)
                      ) && (
                        <Badge className="bg-green-100 text-green-800 ml-auto">
                          Correct
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {question.explanation && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Explanation:
                  </p>
                  <p className="text-sm text-blue-800 whitespace-pre-line">
                    {question.explanation}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline">Improve</Button>
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
        ))}
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
