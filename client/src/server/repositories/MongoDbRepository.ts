// @/server/repositories/mongodbUserRepository.ts
import { connectDB } from "../db/mongoose";
import { User } from "../models/user.model";
import { UserRepository } from "./userRepository";
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
}
