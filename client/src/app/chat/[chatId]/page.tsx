"use client";

import ChatInput from "@/components/ChatInput";
import ConversationComponent from "@/components/ConversationComponent";
import { getMessagesFromDb, addMessageToDb } from "@/lib/apiUtils";
import { IMessage } from "@/lib/types";
import { useChatStore } from "@/stores/chatStore";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ChatPage = () => {
    const { chatId } = useParams();
    const { data: session, status } = useSession();
    const { messages, addMessage, setMessages, setLoading } = useChatStore();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/"); // redirect to login page
        }
    }, [session, status, router]);

    const handleSubmit = (message: string) => {
        const newMessage: IMessage = {
            role: "user",
            content: message,
        };

        addMessageToDb(chatId as string, newMessage);
        addMessage(newMessage);
    };

    useEffect(() => {
        const fetchMsgs = async () => {
            setLoading(true);
            let msgs: IMessage[] = await getMessagesFromDb(chatId as string);

            if (!msgs) msgs = [];

            setMessages(msgs);
            setLoading(false);
        };
        fetchMsgs();
    }, [chatId, setMessages, setLoading]);

    return (
        <div className="flex justify-center items-center w-full h-full flex-col pb-20 relative">
            <div className="flex-1 flex h-full justify-center overflow-scroll w-full">
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
