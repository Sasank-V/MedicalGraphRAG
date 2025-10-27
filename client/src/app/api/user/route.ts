import { User } from "@/server/models";
import { getUserRepository } from "@/server/repositories";
import { DynamoDBChatRepository } from "@/server/repositories/DynamoDbChatRepository";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const provider = (
      process.env.DB_PROVIDER ||
      process.env.DATABASE_PROVIDER ||
      "mongodb"
    ).toLowerCase();

    if (provider === "dynamodb") {
      if (!email)
        return NextResponse.json({ error: "Missing email" }, { status: 400 });
      const userRepo = getUserRepository();
      const chatRepo = new DynamoDBChatRepository();
      const user = await userRepo.getUserByEmail(email);
      if (!user)
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      const chatIds =
        (user.chats as unknown as
          | Array<string | { _id?: string }>
          | undefined) || [];
      const chats = await Promise.all(
        chatIds.map(async (cid) => {
          const id = typeof cid === "string" ? cid : cid?._id ?? String(cid);
          const c = await chatRepo.getChatById(id);
          return c;
        })
      );
      const populated = { ...user, chats: chats.filter(Boolean) };
      return NextResponse.json(populated);
    }

    const user = await User.findOne({ email }).populate("chats");
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
