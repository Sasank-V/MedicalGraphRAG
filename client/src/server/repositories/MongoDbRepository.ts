// @/server/repositories/mongodbUserRepository.ts
import { connectDB } from "../db/mongoose";
import { User } from "../models/user.model";
import { UserRepository } from "./userRepository";
import { IUser } from "@/lib/types";

export class MongoDBUserRepository implements UserRepository {
    async createUser(data: IUser) {
        await connectDB();

        const userFound = await User.find({ email: data.email })

        console.log(userFound);

        if (userFound.length === 0) {
            await User.create(data);
        }

        return data;
    }
}
