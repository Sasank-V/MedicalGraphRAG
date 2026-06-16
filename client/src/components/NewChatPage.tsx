"use client";

import { createNewChat } from "@/lib/apiUtils";
import ChatInput from "./ChatInput";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUserDetailsStore } from "@/stores/userDetailsStore";

const NewChatPage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const { addChat } = useUserDetailsStore();

  const handleCreateNewPage = async (input: string) => {
    const email = session?.user?.email;
    if (!email) return;

    const new_chat = await createNewChat(email, input, input);

    if (!new_chat) return;

    addChat(new_chat);
    // Pass the initial query as a URL parameter so the chat page can auto-submit it
    router.push(
      `/chat/${new_chat._id}?autoSubmit=${encodeURIComponent(input)}`
    );

    return;
  };

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
