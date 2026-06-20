// @/lib/types.ts

export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  sourceDocs?: {
    title: string;
    pages?: string;
    url: string;
    // Optional short excerpt/snippet to show alongside the reference
    excerpt?: string;
    // Where the reference came from, e.g., 'vector_db' | 'graph_db'
    source?: string;
    // Full reference text (untrimmed) to show in dropdown on demand
    text?: string;
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
