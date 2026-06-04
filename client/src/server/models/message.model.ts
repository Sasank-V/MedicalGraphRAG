import { IMessage } from "@/lib/types";
import { Schema } from "mongoose";

export const MessageSchema = new Schema<IMessage>({
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    sourceDocs: [
        {
            title: String,
            snippet: String,
            url: String,
        }
    ]
});