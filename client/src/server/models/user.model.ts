import { IUser } from "@/lib/types";
import mongoose, { Schema } from "mongoose";
import { ChatSchema } from "./chat.model";

export const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    name: { type: String },
    chats: { type: [ChatSchema], default: [] },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema, "users");