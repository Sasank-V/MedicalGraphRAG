import { IChat } from "@/lib/types"
import { create } from "zustand"

interface UserState {
  chats: IChat[]       // entire chat context
  isLoading: boolean
  activeChat: string
  setActiveChat: (chat: string) => void
  setChats: (chats: IChat[]) => void
  addChat: (msg: IChat) => void
  clearChats: () => void
  setLoading: (loading: boolean) => void
}

export const useUserDetailsStore = create<UserState>((set) => ({
  chats: [],
  isLoading: false,
  activeChat: "",
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  setChats: (chats) => set({ chats: chats }),
  addChat: (chat) => set((state) => ({ chats: [...state.chats, chat] })),
  clearChats: () => set({ chats: [] }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
