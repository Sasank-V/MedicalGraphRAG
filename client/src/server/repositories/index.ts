import { MongoDBUserRepository } from "./MongoDbRepository";
import { UserRepository } from "./userRepository";

let userRepository: UserRepository;

export function getUserRepository(): UserRepository {
    if (!userRepository) {
        userRepository = new MongoDBUserRepository();
    }

    return userRepository;
}