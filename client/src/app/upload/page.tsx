"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Upload as UploadIcon,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
  fileId: string;
}

interface JobItem {
  job_id: string;
  status: "queued" | "started" | "finished" | "failed";
  progress?: number;
  message?: string;
  messages?: string[];
  error_message?: string | null;
  result?: unknown;
  meta?: unknown;
}

const backendURL = process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL;

export default function AdminUploadPage() {
  const { data: session } = useSession();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState(0);
  const [streamMessages, setStreamMessages] = useState<string[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch files from API (S3 list) on mount and after uploads
  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/upload", { method: "GET" });
      if (!res.ok) throw new Error("Failed to load uploaded files");
      const data: {
        files: {
          key: string;
          url: string;
          name: string;
          size: number;
          uploadedAt: string;
        }[];
      } = await res.json();
      const mapped: UploadedFile[] = (data.files || []).map((f) => ({
        name: f.name,
        url: f.url,
        size: f.size,
        uploadedAt: f.uploadedAt,
        fileId: f.key,
      }));
      setFiles(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setMessage("");
      setStreamMessages([]);
    } else {
      setMessage("Please select a valid PDF file");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("No file selected");
      return;
    }

    if (!session?.user?.email) {
      setMessage("You must be logged in to upload files");
      return;
    }

    setUploading(true);
    setMessage("");
    setProgress(0);
    setStreamMessages([]);

    try {
      // Step 1: Upload file to get URL (you may need to implement this endpoint)
      const formData = new FormData();
      formData.append("file", file);

      // Upload file to Next.js server first
      setStreamMessages(["Uploading file to server..."]);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to server");
      }

      const uploadData = await uploadResponse.json();
      const fileUrl = uploadData.url;
      const fileId = `file_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      setStreamMessages(["File uploaded, starting processing..."]);

      // Step 2: Call the embed-pdf job endpoint
      const payload = {
        file_url: fileUrl,
        file_name: file.name,
        user_id: session.user.email,
        file_id: fileId,
        batch_size: 2,
        metadata: {
          uploaded_by: session.user.email,
          uploaded_at: new Date().toISOString(),
        },
      };

      const response = await fetch(`${backendURL}/embed-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create embed job");
      const { job_id } = (await response.json()) as { job_id: string };

      // Poll job status
      const poll = async () => {
        try {
          const r = await fetch(`${backendURL}/jobs/${job_id}`);
          if (!r.ok) return;
          const job: JobItem = await r.json();
          setProgress(job.progress ?? 0);
          if (Array.isArray(job.messages)) setStreamMessages(job.messages);
          if (job.status === "finished") {
            setMessage("✅ PDF uploaded and embedded successfully!");
            setProgress(100);
            if (pollRef.current) clearInterval(pollRef.current);
            await fetchFiles();
            setFile(null);
            setTimeout(() => setStreamMessages([]), 3000);
          } else if (job.status === "failed") {
            setMessage(
              `❌ Error: ${job.error_message || job.message || "Failed"}`
            );
            setProgress(0);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch (e) {
          console.error(e);
        }
      };
      await poll();
      pollRef.current = setInterval(poll, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(
        `❌ Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (fileId: string) => {
    const updatedFiles = files.filter((f) => f.fileId !== fileId);
    setFiles(updatedFiles);
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col items-center pb-20">
      <div className="w-full px-2 md:px-3">
        <Card className="w-full border-0 shadow-none">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row gap-3 items-center mb-5">
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="md:flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="w-full md:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" /> Processing
                  </>
                ) : (
                  <>
                    <UploadIcon /> Upload
                  </>
                )}
              </Button>
            </div>

            {uploading && (
              <div className="mb-5">
                <div className="w-full bg-blue-100 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {progress.toFixed(0)}%
                </div>
              </div>
            )}

            {streamMessages.length > 0 && (
              <div className="mb-5 p-3 bg-blue-50 rounded-lg border border-blue-200 max-h-40 overflow-y-auto">
                <div className="text-xs font-semibold text-blue-700 mb-2">
                  Processing Status
                </div>
                {streamMessages.slice(-5).map((msg, idx) => (
                  <div key={idx} className="text-xs text-gray-700 mb-1">
                    • {msg}
                  </div>
                ))}
              </div>
            )}

            {message && (
              <p className="text-sm text-center text-gray-700 mb-5 whitespace-pre-wrap">
                {message}
              </p>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <h2 className="text-base font-semibold text-blue-700">
                Uploaded PDFs
              </h2>
              <div className="relative md:w-72">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                <Input
                  type="text"
                  placeholder="Search files..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <p className="text-center text-gray-500">
                No files uploaded yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredFiles.map((f) => (
                  <div
                    key={f.fileId}
                    className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-white text-blue-600 flex items-center justify-center border border-blue-200">
                        <FileText className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-blue-700 truncate">
                          {f.name}
                        </span>
                        <span className="text-gray-600 text-xs truncate">
                          {(f.size / 1024).toFixed(2)} KB •{" "}
                          {new Date(f.uploadedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(f.fileId)}
                    >
                      <Trash2 /> Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
