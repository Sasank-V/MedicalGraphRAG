"use client";

import ChatInput from "@/components/ChatInput";
import ConversationComponent from "@/components/ConversationComponent";
import {
    getMessagesFromDb,
    addMessageToDb,
    extractAndNumberSources,
} from "@/lib/apiUtils";
import { IMessage } from "@/lib/types";
import { useChatStore } from "@/stores/chatStore";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const ChatPage = () => {
    const { chatId } = useParams();
    const { data: session, status } = useSession();
    const {
        messages,
        addMessage,
        setMessages,
        setLoading,
        updateLastAssistantMessage,
    } = useChatStore();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [session, status, router]);

    const handleSubmit = async (message: string) => {
        if (!message.trim()) return;

        const userMsg: IMessage = {
            role: "user",
            content: message,
            timestamp: new Date(),
            sourceDocs: []
        };
        addMessage(userMsg);
        addMessageToDb(chatId as string, userMsg);

        const aiMsg: IMessage = {
            role: "assistant",
            content: "",
            timestamp: new Date(),
            sourceDocs: []
        };
        addMessage(aiMsg);

        const payload = {
            query: message,
            top_k: 5,
            model: "gemini",
            user_id: session?.user?.email || "guest_user",
            previous_messages: useChatStore.getState().messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        };

        try {
            const res = await fetch("http://localhost:8000/query-stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.body) return console.error("No response stream");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() || "";

                for (const part of parts) {
                    if (!part.startsWith("data:")) continue;
                    const jsonStr = part.replace("data: ", "").trim();
                    if (!jsonStr) continue;

                    try {
                        const parsed = JSON.parse(jsonStr);

                        if (parsed.event === "token") {
                            updateLastAssistantMessage(
                                (prev) => prev + parsed.data
                            );
                        } else if (parsed.event === "status") {
                            updateLastAssistantMessage(parsed.data);
                        } else if (parsed.event === "done") {
                            const finalMsg = useChatStore
                                .getState()
                                .messages.at(-1);
                            const { text: content, sources } =
                                extractAndNumberSources(finalMsg?.content!);

                            const finalSourceDocs = sources.map(
                                (source, i) => ({
                                    title: `Reference [${i+1}]`,
                                    pages: source.pages,
                                    url: source.url,
                                })
                            );

                            updateLastAssistantMessage(
                                content,
                                finalSourceDocs
                            );

                            addMessageToDb(chatId as string, {
                                ...aiMsg,
                                content: content || "",
                                sourceDocs: finalSourceDocs,
                            });
                        }
                    } catch (err) {
                        console.error("Error parsing stream part:", err);
                    }
                }
            }
        } catch (err) {
            console.error("Error in handleSubmit:", err);
        }
    };

    useEffect(() => {
        const fetchMsgs = async () => {
            setLoading(true);
            let msgs: IMessage[] = await getMessagesFromDb(chatId as string);
            setMessages(msgs || []);
            setLoading(false);
        };
        fetchMsgs();
    }, [chatId, setMessages, setLoading]);

    return (
        <div className="flex justify-center items-center w-full h-full flex-col pb-20 relative">
            <div className="flex-1 flex h-full justify-center max-h-[calc(100vh-170px)] overflow-scroll w-full">
                <ConversationComponent messages={messages} />
            </div>
            <ChatInput
                handleEnter={handleSubmit}
                className="absolute bottom-1 w-full justify-center flex"
            />
        </div>
    );
};

export default ChatPage;
