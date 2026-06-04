"use client";

import ChatInput from "./ChatInput";

const NewChatPage = () => {return (
        <div className="flex justify-center items-center w-full h-full flex-col gap-5 pb-20">
            <div className="text-3xl font-semibold">Where should we begin?</div>
            <ChatInput />
        </div>
    );
};
export default NewChatPage;
