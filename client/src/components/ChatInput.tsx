"use client";

import { ArrowUp } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

const ChatInput = () => {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maxHeight = 250;

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            const newHeight = Math.min(
                textareaRef.current.scrollHeight,
                maxHeight
            );
            textareaRef.current.style.height = newHeight + "px";
        }
    }, [value]);

    return (
        <div className="relative md:w-[60%] w-[80%]">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={1}
                placeholder="Type your message..."
                className="outline-0 bg-gray-300 shadow-md p-4 px-6 rounded-4xl w-full resize-none overflow-auto"
                style={{ maxHeight: maxHeight + "px" }}
            />

            {value.length !== 0 && (
                <ArrowUp className="absolute right-[10px] top-[10px] size-[37px] bg-white rounded-full p-2 cursor-pointer" />
            )}
        </div>
    );
};

export default ChatInput;
