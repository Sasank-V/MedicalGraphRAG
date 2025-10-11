// @/server/repositories/mongodbUserRepository.ts
import { connectDB } from "../db/mongoose"
import { User } from "../models/user.model"
import { UserRepository } from "./userRepository"
import { IUser } from "@/lib/types"

export class MongoDBUserRepository implements UserRepository {
  async createUser(data: IUser) {
    await connectDB()
    await User.create(data);

    return data
  }
}
