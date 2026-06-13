import { NextResponse } from "next/server";
import { connectDB } from "@/server/db/mongoose";
import { Chat } from "@/server/models";
import { IMessage } from "@/lib/types";

export async function POST(
    req: Request,
    { params }: { params: { chatId: string } }
) {
    try {
        const chatId = params.chatId;

        const { role, content, sourceDocs = [] } = await req.json();
        await connectDB();

        const chat = await Chat.findById(chatId);
        if (!chat)
            return NextResponse.json(
                { error: "Chat not found" },
                { status: 404 }
            );

        const message: any = { role, content, timestamp: new Date() };

        console.log(message, sourceDocs);

        if (sourceDocs) message.sourceDocs = sourceDocs;

        chat.messages.push(message);
        chat.lastUpdated = new Date();
        await chat.save();

        return NextResponse.json(message);
    } catch (err: any) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Error" },
            { status: 500 }
        );
    }
}

export async function GET(
    req: Request,
    { params }: { params: { chatId: string } }
) {
    try {
        const chatId = params.chatId;

        await connectDB();

        const chat = await Chat.findById(chatId);
        if (!chat)
            return NextResponse.json(
                { error: "Chat not found" },
                { status: 404 }
            );

        const messages: IMessage[] = chat["messages"];

        return NextResponse.json({ messages });
    } catch (err: any) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Error" },
            { status: 500 }
        );
    }
}
