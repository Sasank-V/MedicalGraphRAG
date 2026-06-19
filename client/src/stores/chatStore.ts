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

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  loading: false,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  setLoading: (loading) => set({ loading }),
  updateLastAssistantMessage: (updater, sourceDocs) =>
    set((state) => {
      const updated = [...state.messages];
      // Find the most recent assistant message to update
      let idx = -1;
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === "assistant") {
          idx = i;
          break;
        }
      }
      if (idx !== -1) {
        const target = updated[idx];
        if (typeof updater === "function") {
          target.content = updater(target.content);
        } else {
          target.content = updater;
        }
        if (sourceDocs) {
          (target as IMessage & { sourceDocs?: typeof sourceDocs }).sourceDocs =
            sourceDocs;
        }
      }
      return { messages: updated };
    }),
}));
