import { User } from "@/server/models";
import { NextResponse } from "next/server";

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

        return NextResponse.json(user);
    } catch (err: any) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Error" },
            { status: 500 }
        );
    }
}
