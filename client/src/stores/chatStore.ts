import { IMessage } from "@/lib/types"
import { create } from "zustand"

interface ChatState {
  messages: IMessage[]       // entire chat context
  isLoading: boolean
  setMessages: (msgs: IMessage[]) => void
  addMessage: (msg: IMessage) => void
  clearChat: () => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearChat: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
