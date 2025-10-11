// @/lib/types.ts

export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  sourceDocs?: {
    title: string;
    snippet: string;
    url: string;
  }[];
}

export interface IChat {
  _id: string;
  title: string;
  messages: IMessage[];
  createdAt?: Date;
  lastUpdated?: Date;
}

export interface IUser {
  email: string;
  name?: string;
  chats?: IChat[];
}