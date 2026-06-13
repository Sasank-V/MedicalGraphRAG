"use client";

import { IMessage } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

const ConversationComponent = ({ messages }: { messages: IMessage[] }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [hoveredMsg, setHoveredMsg] = useState<number>(-1);
    const [openRefs, setOpenRefs] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const toggleReferences = (idx: number) => {
        setOpenRefs((prev) => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div className="w-[60%] flex flex-col gap-6 py-5 h-fit">
            {messages.map((message, i) => (
                <div className="flex w-full" key={i}>
                    <div
                        className={`flex gap-1 w-full flex-col ${
                            message.role === "user" ? "items-end" : "items-start"
                        }`}
                    >
                        <div className="flex flex-col">
                            <div
                                onMouseEnter={() => setHoveredMsg(i)}
                                onMouseLeave={() => setHoveredMsg(-1)}
                                className={`relative max-w-[70%] px-4 p-2 rounded-lg whitespace-pre-wrap ${
                                    message.role === "user"
                                        ? "bg-blue-300"
                                        : "bg-gray-200"
                                }`}
                            >
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                                {hoveredMsg === i && (
                                    <div
                                        className={`absolute -bottom-4.5 text-gray-500 text-xs w-full ${
                                            message.role === "user"
                                                ? "text-end right-1"
                                                : "text-start left-1"
                                        }`}
                                    >
                                        {new Date(message.timestamp!)
                                            .toTimeString()
                                            .split(" ")[0]}
                                    </div>
                                )}
                            </div>

                            {(message.sourceDocs || []).length > 0 && (
                                <div className="mt-1 max-w-[70%] flex flex-col gap-1">
                                    <button
                                        onClick={() => toggleReferences(i)}
                                        className="font-semibold text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
                                    >
                                        {openRefs[i] ? "Hide References ▲" : "Show References ▼"}
                                    </button>

                                    {openRefs[i] && (
                                        <div className="flex flex-col gap-1 mt-1">
                                            {message.sourceDocs?.map((ref, idx) => (
                                                <a
                                                    key={idx}
                                                    href={ref.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline text-sm hover:text-blue-800"
                                                >
                                                    {ref.title
                                                        ? ref.title + (ref.pages ? ` ${ref.pages}` : "")
                                                        : `Reference: ${idx + 1}`}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

export default ConversationComponent;
