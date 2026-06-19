import { nanoid } from "nanoid";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getDynamoDocClient } from "../db/dynamodb";
import { ChatRepository } from "./chatRepository";
import { IChat, IMessage } from "@/lib/types";

const CHATS_TABLE = process.env.DYNAMODB_CHATS_TABLE || "Chats";
const MESSAGES_TABLE = process.env.DYNAMODB_MESSAGES_TABLE || "Messages";

export class DynamoDBChatRepository implements ChatRepository {
  async createChat(title: string, firstMessage: IMessage): Promise<IChat> {
    const doc = getDynamoDocClient();
    const chatId = nanoid();
    const now = new Date().toISOString();

    await doc.send(
      new PutCommand({
        TableName: CHATS_TABLE,
        Item: {
          id: chatId,
          title: title ?? "",
          createdAt: now,
          lastUpdated: now,
        },
        ConditionExpression: "attribute_not_exists(id)",
      })
    );

    const messageId = `${Date.now()}#${nanoid(6)}`;
    const msg: IMessage = {
      role: firstMessage.role,
      content: firstMessage.content,
      timestamp: new Date(now),
      ...(firstMessage.sourceDocs
        ? { sourceDocs: firstMessage.sourceDocs }
        : {}),
    };

    await doc.send(
      new PutCommand({
        TableName: MESSAGES_TABLE,
        Item: {
          chatId,
          messageId,
          ...msg,
        },
      })
    );

    const chat: IChat = {
      _id: chatId,
      title: title ?? "",
      messages: [msg],
      createdAt: new Date(now),
      lastUpdated: new Date(now),
    };

    return chat;
  }

  async appendMessage(chatId: string, message: IMessage): Promise<IMessage> {
    const doc = getDynamoDocClient();
    const now = new Date();
    const messageId = `${now.getTime()}#${nanoid(6)}`;

    const msg: IMessage = {
      role: message.role,
      content: message.content,
      timestamp: now,
      ...(message.sourceDocs ? { sourceDocs: message.sourceDocs } : {}),
    };

    // write message
    await doc.send(
      new PutCommand({
        TableName: MESSAGES_TABLE,
        Item: {
          chatId,
          messageId,
          ...msg,
        },
      })
    );

    // update chat lastUpdated
    await doc.send(
      new UpdateCommand({
        TableName: CHATS_TABLE,
        Key: { id: chatId },
        UpdateExpression: "SET lastUpdated = :lu",
        ExpressionAttributeValues: { ":lu": now.toISOString() },
        ConditionExpression: "attribute_exists(id)",
      })
    );

    return msg;
  }

  async getMessages(chatId: string): Promise<IMessage[]> {
    const doc = getDynamoDocClient();
    const res = await doc.send(
      new QueryCommand({
        TableName: MESSAGES_TABLE,
        KeyConditionExpression: "chatId = :c",
        ExpressionAttributeValues: { ":c": chatId },
        ScanIndexForward: true, // ascending by messageId (timestamp prefix)
      })
    );

    const items = (res.Items || []) as Array<
      IMessage & { messageId: string; chatId: string }
    >;
    return items.map(({ role, content, timestamp, sourceDocs }) => ({
      role,
      content,
      timestamp: timestamp
        ? new Date(timestamp as unknown as string)
        : undefined,
      ...(sourceDocs ? { sourceDocs } : {}),
    }));
  }

  async getChatById(chatId: string): Promise<IChat | null> {
    const doc = getDynamoDocClient();
    const res = await doc.send(
      new GetCommand({ TableName: CHATS_TABLE, Key: { id: chatId } })
    );
    const item = res.Item as
      | (IChat & { id: string; createdAt?: string; lastUpdated?: string })
      | undefined;
    if (!item) return null;
    return {
      _id: item.id,
      title: item.title,
      messages: [],
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : undefined,
    };
  }
}
