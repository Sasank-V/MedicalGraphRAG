import { NextResponse } from "next/server";
import { connectDB } from "@/server/db/mongoose";
import { User, Chat } from "@/server/models";

export async function POST(req: Request) {
    try {
        const { email, first_message, title = "" } = await req.json();
        await connectDB();

        const user = await User.findOne({ email });
        if (!user)
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );

        const message: any = { role: "user", content: first_message, timestamp: new Date() };

        const chat = await Chat.create({ title });
        chat.messages.push(message)
        chat.save()

        user.chats.push(chat._id);

        await user.save();

        return NextResponse.json({ chat });
    } catch (err: any) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Error" },
            { status: 500 }
        );
    }
}