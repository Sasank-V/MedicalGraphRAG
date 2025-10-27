// @/server/repositories/mongodbUserRepository.ts
import { connectDB } from "../db/mongoose";
import { User } from "../models/user.model";
import { UserRepository } from "./userRepository";
import mongoose from "mongoose";
import { IUser } from "@/lib/types";

export class MongoDBUserRepository implements UserRepository {
  async createUser(data: IUser) {
    await connectDB();

    const userFound = await User.find({ email: data.email });

    console.log(userFound);

    if (userFound.length === 0) {
      await User.create(data);
    }

    return data;
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    await connectDB();

    const user = await User.findOne({ email }).lean<IUser>();

    if (!user) {
      return null;
    }

    return {
      ...user,
      _id: user._id?.toString(),
    };
  }

  async addChatToUser(email: string, chatId: string): Promise<void> {
    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return;
    try {
      // Attempt to cast to ObjectId for Mongo users
      const oid = new mongoose.Types.ObjectId(chatId);
      // Ensure array exists
      if (!Array.isArray(user.chats))
        user.chats = [] as unknown as mongoose.Types.ObjectId[];
      // Avoid duplicates
      const chatsArr = user.chats as unknown as mongoose.Types.ObjectId[];
      if (!chatsArr.some((id) => id.toString() === oid.toString())) {
        chatsArr.push(oid);
        await user.save();
      }
    } catch {
      // chatId not a valid ObjectId (likely Dynamo-generated). Since this path
      // is not used for MongoDB provider in our routes, safely no-op.
    }
  }
}
