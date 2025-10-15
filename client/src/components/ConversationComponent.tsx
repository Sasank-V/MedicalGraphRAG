"use client";

import { IMessage } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const ConversationComponent = ({ messages }: { messages: IMessage[] }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    const [hoveredMsg, setHoveredMsg] = useState<number>(-1);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="w-[60%] flex flex-col gap-6 py-5 h-fit">
            {messages.map((message, i) => (
                <div className="flex w-full" key={i}>
                    <div
                        className={`flex gap-1 w-full ${
                            message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                        }`}
                    >
                        <div
                            onMouseEnter={() => setHoveredMsg(i)}
                            onMouseLeave={() => setHoveredMsg(-1)}
                            className={`relative w-fit px-4 p-2 rounded-lg whitespace-pre-wrap ${
                                message.role === "user"
                                    ? "bg-blue-300"
                                    : "bg-gray-200"
                            }`}
                        >
                            {message.content}
                            {hoveredMsg === i && (
                                <div className="absolute -bottom-4 text-gray-500 right-1 text-xs w-full text-end">
                                    {
                                        new Date(message.timestamp!)
                                            .toTimeString()
                                            .split(" ")[0]
                                    }
                                </div>
                            )}
                        </div>
                        {/* {message.role === "user" && (
                            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                {session && !session.user?.image ? (
                                    <User className="text-white size-4" />
                                ) : (
                                    <Image
                                        src={session?.user?.image!}
                                        alt="User Image"
                                        width={64}
                                        height={64}
                                        className="rounded-full"
                                    />
                                )}
                            </div>
                        )} */}
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};
export default ConversationComponent;
