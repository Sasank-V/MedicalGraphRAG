"use client";

import { useUserDetailsStore } from "@/stores/userDetailsStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface UploadedFile {
    name: string;
    url: string;
    size: number;
    uploadedAt: string;
}

export default function AdminUploadPage() {
    const router = useRouter();
    const { isAdmin } = useUserDetailsStore();

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [search, setSearch] = useState("");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isAdmin === undefined) return;
        if (!isAdmin) {
            router.push("/");
        }
    }, [isAdmin, router]);

    useEffect(() => {
        const mockFiles: UploadedFile[] = [
            {
                name: "Machine_Learning_Syllabus.pdf",
                url: "#",
                size: 2048,
                uploadedAt: new Date(
                    Date.now() - 1000 * 60 * 60 * 5
                ).toISOString(),
            },
            {
                name: "Deep_Learning_Tutorial.pdf",
                url: "#",
                size: 4096,
                uploadedAt: new Date(
                    Date.now() - 1000 * 60 * 60 * 24 * 2
                ).toISOString(),
            },
            {
                name: "AI_Research_Paper.pdf",
                url: "#",
                size: 8192,
                uploadedAt: new Date(
                    Date.now() - 1000 * 60 * 60 * 10
                ).toISOString(),
            },
        ];
        setFiles(mockFiles);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setMessage("");
        } else {
            setMessage("Please select a valid PDF file");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("No file selected");
            return;
        }

        setUploading(true);
        setMessage("");
        setProgress(0);

        setUploading(false);
        setMessage("✅ PDF uploaded successfully!");
        setFile(null);
        const newFile: UploadedFile = {
            name: file.name,
            url: "#",
            size: file.size,
            uploadedAt: new Date().toISOString(),
        };
        setFiles((prev) => [newFile, ...prev]);
    };

    const handleDelete = (fileName: string) => {
        setFiles(files.filter((f) => f.name !== fileName));
    };

    const filteredFiles = files.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col items-center justify-start h-full w-full py-10">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-[90%] max-w-3xl border border-blue-200">
                <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
                    Admin PDF Dashboard
                </h1>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="w-full border border-blue-300 rounded-lg p-2 text-sm"
                    />

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={`w-full sm:w-40 py-2 rounded-lg font-semibold text-white transition 
                            ${
                                uploading
                                    ? "bg-blue-300 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600"
                            }`}
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                </div>

                {uploading && (
                    <div className="w-full bg-blue-100 rounded-full h-3 mb-4">
                        <div
                            className="bg-blue-500 h-3 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {message && (
                    <p className="text-sm text-center text-gray-700 mb-4 whitespace-pre-wrap">
                        {message}
                    </p>
                )}

                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold text-blue-600">
                        Uploaded PDFs
                    </h2>
                    <input
                        type="text"
                        placeholder="Search files..."
                        className="border border-blue-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {filteredFiles.length === 0 ? (
                    <p className="text-center text-gray-500">
                        No files uploaded yet.
                    </p>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {filteredFiles.map((f) => (
                            <div
                                key={f.name}
                                className="flex justify-between items-center bg-blue-100 p-3 rounded-lg hover:bg-blue-200 transition"
                            >
                                <div className="flex flex-col text-sm">
                                    <a
                                        href={f.url}
                                        target="_blank"
                                        className="font-medium text-blue-700 hover:underline"
                                    >
                                        {f.name}
                                    </a>
                                    <span className="text-gray-600 text-xs">
                                        {(f.size / 1024).toFixed(2)} KB •{" "}
                                        {new Date(
                                            f.uploadedAt
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(f.name)}
                                    className="text-red-500 text-sm font-semibold hover:text-red-700 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
