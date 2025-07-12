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

interface ImproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  onImproveSuccess: (questionId: string, feedback: string) => void;
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

    // Simulate GPT reprocessing
    setTimeout(() => {
      onImproveSuccess(questionId, feedback);
      setIsProcessing(false);
      setFeedback("");
      onOpenChange(false);
    }, 2000);
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
            Provide feedback to improve this question. GPT will reprocess the
            question based on your input.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Enter your feedback for improving this question..."
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
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
