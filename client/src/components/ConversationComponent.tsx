"use client";

import { IMessage } from "@/lib/types";
import { useEffect, useRef } from "react";
import Image from "next/image";

const ConversationComponent = ({ messages }: { messages: IMessage[] }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="max-h-[calc(100vh-150px)] w-[60%] flex flex-col gap-4 py-10">
            {messages.map((message, i) => (
                <div className="flex w-full" key={i}>
                    <div
                        className={`flex gap-1 w-full ${
                            message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                        }`}
                    >
                        <div className={`w-fit px-4 p-2 rounded-lg whitespace-pre-wrap ${
                                message.role === "user"
                                ? "bg-blue-400"
                                : "bg-gray-200"
                            }`}
                        >
                            {message.content}
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
