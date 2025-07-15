"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface ImproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  onImproveSuccess: (questionId: string, rewrittenText: string) => void;
}

export function ImproveDialog({
  open,
  onOpenChange,
  questionId,
  onImproveSuccess,
}: ImproveDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinue = async () => {
    if (!feedback.trim()) return;

    setIsProcessing(true);

    try {
      const res = await fetch(
        "http://localhost:4000/documents/improve-question",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            improvementPrompt: feedback,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Server error response:", data);
        throw new Error(data.message || "Failed to improve question");
      }

      if (!data.rewrittenText) {
        throw new Error("Missing rewrittenText in response");
      }

      onImproveSuccess(questionId, data.rewrittenText);
      setFeedback("");
      onOpenChange(false);
    } catch (err) {
      console.error("Error improving question:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setFeedback("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Improve Question</DialogTitle>
          <DialogDescription>
            Provide feedback to improve this question. GPT will reprocess it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Enter feedback to improve the question..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isProcessing}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Close
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!feedback.trim() || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Improving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
