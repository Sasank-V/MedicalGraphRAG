import { IChat } from "@/lib/types"
import { create } from "zustand"

interface UserState {
  isAdmin: boolean | undefined
  chats: IChat[]       // entire chat context
  isLoading: boolean
  activeChat: string
  setIsAdmin: (variable: boolean) => void
  setActiveChat: (chat: string) => void
  setChats: (chats: IChat[]) => void
  addChat: (msg: IChat) => void
  clearChats: () => void
  setLoading: (loading: boolean) => void
}

export const useUserDetailsStore = create<UserState>((set) => ({
  isAdmin: undefined,
  chats: [],
  isLoading: false,
  activeChat: "",
  setIsAdmin: (variable) => set({ isAdmin: variable }),
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  setChats: (chats) => set({ chats: chats }),
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
  clearChats: () => set({ chats: [] }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
