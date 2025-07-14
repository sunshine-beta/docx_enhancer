"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UploadDialog } from "@/components/upload-dialog";
import { Download, Eye, RefreshCcw } from "lucide-react";
import Link from "next/link";

interface DocumentItem {
  _id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  date: string;
}

const getStatusBadge = (status: DocumentItem["status"]) => {
  const colors = {
    pending: "bg-gray-100 text-gray-800 cursor-wait",
    processing: "bg-blue-100 text-blue-800 animate-pulse",
    completed:
      "bg-green-100 text-green-800 duration-300 transition-all hover:bg-green-600 cursor-pointer hover:text-white",
    failed:
      "bg-red-100 text-red-800 duration-300 transition-all hover:bg-red-600 hover:text-white cursor-pointer",
  };

  return (
    <Badge className={colors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const defaultPrompt = `You are an expert question generator. Based on the provided document content, create multiple-choice questions that:

1. Test comprehension of key concepts
2. Include 4 answer choices (A, B, C, D)
3. Have only one correct answer
4. Include a clear explanation for the correct answer
5. Are appropriate for the document's subject matter and complexity level

Format each question as:
Question: [Your question here]
A) [Choice A]
B) [Choice B]
C) [Choice C]
D) [Choice D]
Correct Answer: [Letter]
Explanation: [Detailed explanation]
references: []`;

export default function DocumentPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const iconRef = useRef<SVGSVGElement | null>(null);

  // Get All Documents
  const fetchDocuments = async () => {
    try {
      const res = await fetch("http://localhost:4000/documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Error fetching documents", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  const getLatestPrompt = async () => {
    try {
      const res = await fetch("http://localhost:4000/prompt");
      if (!res.ok) throw new Error("No prompt found");

      const data = await res.json();
      return data.content || defaultPrompt;
    } catch (error) {
      console.warn("Falling back to default prompt:", error);
      return defaultPrompt;
    }
  };

  // Post Documents
  const handleUploadSuccess = async (file: File) => {
    try {
      const prompt = await getLatestPrompt();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt);

      const res = await fetch("http://localhost:4000/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Upload failed with status:", res.status);
        console.error("Error response:", errData);
        throw new Error("Upload failed");
      }

      fetchDocuments();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handlePageReload = () => {
    if (iconRef.current) {
      iconRef.current.classList.add("animate-spin");
    }
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const handleDownload = (filename: string) => {
    const link = document.createElement("a");
    link.href = "#";
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload a .xlsx file to process and generate questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsUploadOpen(true)}>Upload Document</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="w-full flex items-center justify-between">
            Uploaded Documents
            <RefreshCcw
              ref={iconRef}
              size={18}
              className="cursor-pointer"
              onClick={handlePageReload}
            />
          </CardTitle>
          <CardDescription>
            Manage and view your processed documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell className="font-medium">{doc.filename}</TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>{doc.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {doc.status === "completed" && doc._id && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/documents/${doc._id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.filename)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
