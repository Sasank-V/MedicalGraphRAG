"use client";

import { IMessage } from "@/lib/types";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";

type Props = {
  messages: IMessage[];
  statusMessages?: string[];
  isStreaming?: boolean;
};

const ConversationComponent = ({
  messages,
  statusMessages = [],
  isStreaming = false,
}: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [hoveredMsg, setHoveredMsg] = useState<number>(-1);
  const [openRefs, setOpenRefs] = useState<{ [key: number]: boolean }>({});
  const [openRefText, setOpenRefText] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, statusMessages, isStreaming]);
  // console.log(messages);
  const toggleReferences = (idx: number) => {
    setOpenRefs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 py-5 h-fit">
      {messages.map((message, i) => {
        const isUser = message.role === "user";
        const isLastAssistant =
          i === messages.length - 1 &&
          message.role === "assistant" &&
          isStreaming &&
          (statusMessages?.length || 0) > 0;
        return (
          <div
            key={i}
            className={`flex w-full ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <div className="flex flex-col max-w-[70%]">
              <div
                onMouseEnter={() => setHoveredMsg(i)}
                onMouseLeave={() => setHoveredMsg(-1)}
                className={`relative px-4 py-2 rounded-xl text-sm whitespace-pre-wrap shadow-sm ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                }`}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>

                {isLastAssistant && (
                  <div className="mt-2 text-xs rounded-md p-2 border">
                    <div className="space-y-1">
                      {(statusMessages || []).slice(-1).map((s, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Loader2 className="size-3 animate-spin" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hoveredMsg === i && (
                  <div
                    className={`absolute -bottom-4 text-gray-500 text-xs ${
                      isUser ? "right-1" : "right-1"
                    }`}
                  >
                    {new Date(message.timestamp!).toTimeString().split(" ")[0]}
                  </div>
                )}
              </div>
              {(message.sourceDocs || []).length > 0 && (
                <div className="mt-1">
                  <button
                    onClick={() => toggleReferences(i)}
                    className="font-medium text-xs text-gray-600 hover:text-gray-800 focus:outline-none"
                  >
                    {openRefs[i] ? "Hide References ▲" : "Show References ▼"}
                  </button>

                  {openRefs[i] && (
                    <div className="flex flex-col gap-2 mt-1">
                      {message.sourceDocs?.map((ref, idx) => {
                        const indexLabel = `[${idx + 1}]`;
                        const hasUrl = ref.url && ref.url !== "#";
                        let displayTitle = ref.title || "Source";
                        if (hasUrl) {
                          try {
                            const last =
                              decodeURI(ref.url).split("/").pop() || ref.url;
                            const name = (last as string).split("?")[0];
                            if (name) displayTitle = name;
                          } catch {}
                        }
                        const key = `${i}-${idx}`;
                        const isOpen = !!openRefText[key];
                        return (
                          <div
                            key={idx}
                            className="text-xs text-gray-700 border rounded-md p-2"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-800">
                                {indexLabel}
                              </span>
                              {hasUrl ? (
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800 truncate max-w-full"
                                  title={ref.url}
                                >
                                  {displayTitle}
                                </a>
                              ) : (
                                <span className="text-gray-900 font-medium">
                                  {displayTitle}
                                </span>
                              )}
                              {ref.pages && (
                                <span className="text-gray-600">
                                  • Pages {ref.pages}
                                </span>
                              )}
                              {ref.source && (
                                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border">
                                  {ref.source === "graph_db"
                                    ? "Graph"
                                    : ref.source === "vector_db"
                                    ? "Vector"
                                    : ref.source}
                                </span>
                              )}
                            </div>
                            {(ref.text || ref.excerpt) && (
                              <div className="mt-1">
                                <button
                                  className="text-[11px] text-gray-700 underline hover:text-gray-900"
                                  onClick={() =>
                                    setOpenRefText((prev) => ({
                                      ...prev,
                                      [key]: !prev[key],
                                    }))
                                  }
                                >
                                  {isOpen ? "Hide text ▲" : "Show text ▼"}
                                </button>
                                {isOpen && (
                                  <div className="mt-1 max-h-48 overflow-auto rounded bg-gray-50 p-2 border text-[11px] leading-snug whitespace-pre-wrap">
                                    <ReactMarkdown>
                                      {ref.text || ref.excerpt}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ConversationComponent;
