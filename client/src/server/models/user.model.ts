import { IUser } from "@/lib/types";
import mongoose, { Schema } from "mongoose";

export const UserSchema = new Schema<IUser>({
    role: { type: String, default: "user" },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    chats: [{ type: Schema.Types.ObjectId, ref: "Chat" }],
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema, "users");