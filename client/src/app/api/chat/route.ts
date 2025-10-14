import { NextResponse } from "next/server";
import { connectDB } from "@/server/db/mongoose";
import { User, Chat } from "@/server/models";

export async function POST(req: Request) {
    try {
        const { email, title } = await req.json();
        await connectDB();

        const user = await User.findOne({ email });
        if (!user)
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );

        const chat = await Chat.create({ title });
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

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const email = url.searchParams.get("email");

        const user = await User.findOne({ email }).populate("chats");
        if (!user)
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );

        return NextResponse.json({ chats: user.chats });
    } catch (err: any) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Error" },
            { status: 500 }
        );
    }
}
