import { NextResponse } from "next/server";
import { connectDB } from "@/server/db/mongoose";
import { Chat } from "@/server/models";
import { IMessage } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    const { role, content, sourceDocs = [] } = await req.json();
    await connectDB();

    const chat = await Chat.findById(chatId);
    if (!chat)
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const message: IMessage = { role, content, timestamp: new Date() };

    console.log(message, sourceDocs);

    if (sourceDocs) (message as IMessage & { sourceDocs: typeof sourceDocs }).sourceDocs = sourceDocs;

    chat.messages.push(message);
    chat.lastUpdated = new Date();
    await chat.save();

    return NextResponse.json(message);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    await connectDB();

    const chat = await Chat.findById(chatId);
    if (!chat)
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const messages: IMessage[] = chat["messages"];

    return NextResponse.json({ messages });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
