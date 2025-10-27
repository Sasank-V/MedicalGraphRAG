import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getDynamoDocClient } from "../db/dynamodb";
import { UserRepository } from "./userRepository";
import { IUser } from "@/lib/types";

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || "Users";

export class DynamoDBUserRepository implements UserRepository {
  async createUser(data: IUser): Promise<IUser> {
    const doc = getDynamoDocClient();

    // Use email as the partition key. If item exists, do nothing (idempotent).
    try {
      await doc.send(
        new PutCommand({
          TableName: USERS_TABLE,
          Item: {
            // Primary key
            email: data.email,
            // Fields
            role: data.role ?? "user",
            name: data.name,
            chats: data.chats ?? [],
            _id: data._id ?? data.email, // keep _id for app compatibility
          },
          ConditionExpression: "attribute_not_exists(email)",
        })
      );
    } catch (err: unknown) {
      // If item already exists, ignore the conditional check failure to keep idempotent behavior
      const anyErr = err as
        | { name?: string; Code?: string; code?: string }
        | undefined;
      const code = anyErr?.name || anyErr?.Code || anyErr?.code;
      if (code !== "ConditionalCheckFailedException") {
        throw err;
      }
    }

    return { ...data, _id: data._id ?? data.email };
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    const doc = getDynamoDocClient();
    const res = await doc.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { email },
      })
    );

    const item = res.Item as IUser | undefined;
    if (!item) return null;

    // Ensure _id is a string for compatibility
    return { ...item, _id: item._id ?? email };
  }

  async addChatToUser(email: string, chatId: string): Promise<void> {
    const doc = getDynamoDocClient();
    // Read existing user
    const res = await doc.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { email } })
    );
    const user = res.Item as (IUser & { chats?: string[] }) | undefined;
    if (!user) return;
    const chats = Array.isArray(user.chats) ? user.chats : [];
    if (chats.includes(chatId)) return;
    const updated = [...chats, chatId];
    await doc.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { email },
        UpdateExpression: "SET chats = :ch",
        ExpressionAttributeValues: { ":ch": updated },
      })
    );
  }
}
