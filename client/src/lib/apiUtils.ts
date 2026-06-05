import { IMessage } from "@/lib/types";

export const getMessagesFromDb = async (chatId: string): Promise<IMessage[]> => {
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
            body: JSON.stringify(message)
        });

        const new_message = await res.json();
        return new_message;
    } catch (err) {
        console.error(err);
        return null;
    }
};
