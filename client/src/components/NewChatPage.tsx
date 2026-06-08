"use client";

import { createNewChat } from "@/lib/apiUtils";
import ChatInput from "./ChatInput";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useUserDetailsStore } from "@/stores/userDetailsStore";

const NewChatPage = () => {
    const {data: session} = useSession();

    const {addChat} = useUserDetailsStore();

    const handleCreateNewPage = async (input: string) => {
        const email = session?.user?.email;
        if (!email) return;

        const new_chat = await createNewChat(email, input, input);

        if (!new_chat) return;

        addChat(new_chat)
        redirect(`/chat/${new_chat._id}`)

        return;
    }

    return (
        <div className="flex justify-center items-center w-full h-full flex-col gap-5 pb-20">
            <div className="text-3xl font-semibold">Where should we begin?</div>
            <ChatInput
                handleEnter={handleCreateNewPage}
                className="w-full justify-center flex"
            />
        </div>
    );
};
export default NewChatPage;
