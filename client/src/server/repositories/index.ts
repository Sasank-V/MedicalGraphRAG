import { MongoDBUserRepository } from "./MongoDbRepository";
import { DynamoDBUserRepository } from "./DynamoDbRepository";
import { UserRepository } from "./userRepository";

let userRepository: UserRepository;

export function getUserRepository(): UserRepository {
  if (!userRepository) {
    const provider = (
      process.env.DB_PROVIDER ||
      process.env.DATABASE_PROVIDER ||
      "mongodb"
    ).toLowerCase();
    if (provider === "dynamodb") {
      userRepository = new DynamoDBUserRepository();
    } else {
      userRepository = new MongoDBUserRepository();
    }
  }

  return userRepository;
}
