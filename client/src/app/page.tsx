"use client";

import LandingPage from "@/components/LandingPage";
import NewChatPage from "@/components/NewChatPage";
import { useSession } from "next-auth/react";

const HomePage = () => {
    const { data: session, status } = useSession();

    return <div className="w-full h-full">{status !== "authenticated" ? <LandingPage /> : <NewChatPage />}</div>;
};
export default HomePage;
