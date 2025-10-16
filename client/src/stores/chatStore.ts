import { create } from "zustand";
import { IMessage } from "@/lib/types";

interface ChatState {
    messages: IMessage[];
    loading: boolean;
    addMessage: (msg: IMessage) => void;
    setMessages: (msgs: IMessage[]) => void;
    setLoading: (loading: boolean) => void;
    updateLastAssistantMessage: (
        updater: string | ((prev: string) => string),
        sourceDocs?: { title: string; url: string; pages?: string }[]
    ) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    loading: false,
    addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
    setMessages: (msgs) => set({ messages: msgs }),
    setLoading: (loading) => set({ loading }),
    updateLastAssistantMessage: (updater, sourceDocs) =>
        set((state) => {
            const updated = [...state.messages];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
                if (typeof updater === "function") {
                    last.content = updater(last.content);
                } else {
                    last.content = updater;
                }
                if (sourceDocs) {
                    (last as any).sourceDocs = sourceDocs;
                }
            }
            return { messages: updated };
        }),
}));
