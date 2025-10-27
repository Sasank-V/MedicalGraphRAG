import { NextResponse } from "next/server";
import { connectDB } from "@/server/db/mongoose";
import { User, Chat } from "@/server/models";
import { getUserRepository } from "@/server/repositories";
import { DynamoDBChatRepository } from "@/server/repositories/DynamoDbChatRepository";

export async function POST(req: Request) {
  try {
    const { email, first_message, title = "" } = await req.json();
    const provider = (
      process.env.DB_PROVIDER ||
      process.env.DATABASE_PROVIDER ||
      "mongodb"
    ).toLowerCase();

    if (provider === "dynamodb") {
      const userRepo = getUserRepository();
      const chatRepo = new DynamoDBChatRepository();
      const user = await userRepo.getUserByEmail(email);
      if (!user)
        return NextResponse.json({ error: "User not found" }, { status: 404 });

      const message = {
        role: "user" as const,
        content: first_message,
        timestamp: new Date(),
      };

      const chat = await chatRepo.createChat(title, message);
      await userRepo.addChatToUser(email, chat._id);
      return NextResponse.json({ chat });
    }

    // Default MongoDB path
    await connectDB();

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const message = {
      role: "user" as const,
      content: first_message,
      timestamp: new Date(),
    };

    const chat = await Chat.create({ title });
    chat.messages.push(message);
    chat.save();

    user.chats.push(chat._id);

    await user.save();

    return NextResponse.json({ chat });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
