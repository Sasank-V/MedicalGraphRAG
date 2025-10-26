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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 py-5 h-fit">
      {messages.map((message, i) => {
        const isUser = message.role === "user";
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
                {hoveredMsg === i && (
                  <div
                    className={`absolute -bottom-4 text-gray-500 text-xs ${
                      isUser ? "right-1" : "left-1"
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
                    <div className="flex flex-col gap-1 mt-1">
                      {message.sourceDocs?.map((ref, idx) => (
                        <a
                          key={idx}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-xs hover:text-blue-800"
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
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ConversationComponent;
