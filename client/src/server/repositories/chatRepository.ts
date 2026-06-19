import { IChat, IMessage } from "@/lib/types";

export interface ChatRepository {
  createChat(title: string, firstMessage: IMessage): Promise<IChat>;
  appendMessage(chatId: string, message: IMessage): Promise<IMessage>;
  getMessages(chatId: string): Promise<IMessage[]>;
  getChatById(chatId: string): Promise<IChat | null>;
}
