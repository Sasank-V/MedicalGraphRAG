"use client";

import LandingPage from "@/components/LandingPage";
import { useSession } from "next-auth/react";

const HomePage = () => {
    const { data: session, status } = useSession();

    return <div>{status !== "authenticated" && <LandingPage />}</div>;
};
export default HomePage;
