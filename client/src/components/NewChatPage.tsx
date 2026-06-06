"use client";

import ChatInput from "./ChatInput";

const NewChatPage = () => {

    const handleCreateNewPage = async () => {
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
