import { IChat, IMessage } from "@/lib/types";

export const getMessagesFromDb = async (
    chatId: string
): Promise<IMessage[]> => {
    try {
        const res = await fetch(`/api/chat/${chatId}`);
        const data: { messages: IMessage[] } = await res.json();
        return data.messages;
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const addMessageToDb = async (
    chatId: string,
    message: IMessage
): Promise<IMessage | null> => {
    try {
        const res = await fetch(`/api/chat/${chatId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });

        const new_message = await res.json();
        return new_message;
    } catch (err) {
        console.error(err);
        return null;
    }
};

export const createNewChat = async (
    email: string,
    first_message: string,
    title: string = ""
): Promise<IChat | null> => {
    try {
        const bodyData = {
            email,
            first_message,
            title,
        };
        const res = await fetch(`/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyData),
        });

        const { chat: new_chat } = await res.json();
        return new_chat;
    } catch (err) {
        console.error(err);
        return null;
    }
};
