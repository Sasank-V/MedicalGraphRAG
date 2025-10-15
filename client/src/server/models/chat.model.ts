import { IChat } from "@/lib/types";
import mongoose, { Schema } from "mongoose";
import { MessageSchema } from "./message.model";

export const ChatSchema = new Schema<IChat>({
    title: { type: String, required: true, default: "" },
    messages: { type: [MessageSchema], required: true, default: [] },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
})

export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema, "chats");