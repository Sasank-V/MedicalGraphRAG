"use client";

import { ArrowUp } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";

const ChatInput = ({
    className = "",
    handleEnter,
}: {
    className: string;
    handleEnter: (message: string) => void;
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maxHeight = 250;

    const [input, setInput] = useState<string>("");

    const handleSubmit = (e?: React.KeyboardEvent | React.MouseEvent) => {
        if (e && "key" in e) {
            if (e.key === "Enter" && !e.shiftKey) {
                if (input.trim().length === 0) {
                    e?.preventDefault();
                    return;
                }
                e.preventDefault();
                handleEnter(input);
                setInput("");
            }
            return;
        }
        
        if (input.trim().length === 0) {
            e?.preventDefault();
            return;
        }
        handleEnter(input);
        setInput("");
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            const newHeight = Math.min(
                textareaRef.current.scrollHeight,
                maxHeight
            );
            textareaRef.current.style.height = newHeight + "px";
        }
    }, [input]);

    return (
        <div className={className}>
            <div className="relative md:w-[70%] w-[80%]">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleSubmit}
                    rows={1}
                    placeholder="Type your message..."
                    className="outline-0 bg-gray-300 shadow-md p-4 px-6 rounded-4xl w-full resize-none overflow-auto"
                    style={{ maxHeight: maxHeight + "px" }}
                />

                {input.length !== 0 && (
                    <ArrowUp
                        onClick={handleSubmit}
                        className="absolute right-[10px] top-[10px] size-[37px] bg-white rounded-full p-2 cursor-pointer"
                    />
                )}
            </div>
        </div>
    );
};

export default ChatInput;
