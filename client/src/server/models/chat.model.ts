import { IChat } from "@/lib/types";
import mongoose, { Schema } from "mongoose";
import { MessageSchema } from "./message.model";

export const ChatSchema = new Schema<IChat>({
    title: { type: String, required: true },
    messages: { type: [MessageSchema], required: true },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
})