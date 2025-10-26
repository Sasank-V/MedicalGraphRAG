// @/lib/types.ts

export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  sourceDocs?: {
    title: string;
    pages?: string;
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
  _id?: string;
  role?: "user" | "admin";
  email: string;
  name?: string;
  chats?: IChat[];
}
