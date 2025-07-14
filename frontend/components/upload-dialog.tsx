"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: (file: File) => Promise<void>;
}

export function UploadDialog({
  open,
  onOpenChange,
  onUploadSuccess,
}: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");

    if (file) {
      if (!file.name.endsWith(".xlsx")) {
        setError("Please select a .xlsx file only");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleContinue = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setIsProcessing(true);

    try {
      await onUploadSuccess(selectedFile);

      setTimeout(() => {
        setIsProcessing(false);
        setSelectedFile(null);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      console.error("Upload failed", err);
      setError("Upload failed");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedFile(null);
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Select a .xlsx file to upload and process.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">Document File</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.name}
              </p>
            )}
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
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
