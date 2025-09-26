"use client";

import React, { useState } from "react";
import {
    LogOut,
    Plus,
    Settings,
    User,
    Menu,
    MessageCircle,
    ChevronLeft,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

const mockChats = [
    {
        id: "1",
        title: "Hypertension Treatment",
        lastMessage: "What are the latest guidelines for...",
        timestamp: "2m ago",
        unread: true,
    },
    {
        id: "2",
        title: "Diabetes Management",
        lastMessage: "Can you explain the HbA1c...",
        timestamp: "1h ago",
        unread: false,
    },
    {
        id: "3",
        title: "Cardiology Consultation",
        lastMessage: "What are the symptoms of...",
        timestamp: "3h ago",
        unread: false,
    },
    {
        id: "4",
        title: "Medication Interactions",
        lastMessage: "Are there any contraindications...",
        timestamp: "1d ago",
        unread: false,
    },
    {
        id: "5",
        title: "Pediatric Guidelines",
        lastMessage: "Dosage recommendations for...",
        timestamp: "2d ago",
        unread: false,
    },
];

const Sidebar = ({ children }: { children: React.ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentChatId, setCurrentChatId] = useState("1");
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const { data: session, status } = useSession();

    const loadChat = (chatId: string) => {
        setCurrentChatId(chatId);
    };

    return (
        <>
            {/* Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 md:hidden transition-opacity duration-200"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className="flex w-full">
                {status === "authenticated" && (
                    <div
                        className={`fixed md:relative inset-y-0 left-0 z-40 bg-gray-50 border-r border-gray-200 transform transition-all duration-300 ease-out h-full
                        ${
                            sidebarOpen
                                ? "translate-x-0"
                                : "-translate-x-full md:translate-x-0"
                        }
                        ${sidebarOpen ? "w-72" : "md:w-18"} 
                        `}
                    >
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="p-4 bg-white">
                                <div className="flex items-center justify-between">
                                    {sidebarOpen ? (
                                        <>
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                                                    <MessageCircle className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                            <button
                                                className="p-3 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200"
                                                onClick={() =>
                                                    setSidebarOpen(!sidebarOpen)
                                                }
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="p-3 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200 mx-auto"
                                            onClick={() =>
                                                setSidebarOpen(!sidebarOpen)
                                            }
                                        >
                                            <Menu className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* New Chat Button */}
                            <div className="p-4">
                                <button
                                    className={`group bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-sm ${
                                        sidebarOpen
                                            ? "w-full p-3"
                                            : "size-10 mx-auto"
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Plus className="size-4 text-white" />
                                        {sidebarOpen && (
                                            <span className="font-medium text-white text-sm">
                                                New Chat
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </div>

                            {/* Chat History */}
                            <div className="flex-1 overflow-y-auto px-4 pb-4">
                                {sidebarOpen && (
                                    <>
                                        <div className="mb-3 px-2">
                                            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                Recent Conversations
                                            </h3>
                                        </div>

                                        <div className="space-y-1">
                                            {mockChats.map((chat) => (
                                                <button
                                                    key={chat.id}
                                                    onClick={() =>
                                                        loadChat(chat.id)
                                                    }
                                                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                                                        currentChatId ===
                                                        chat.id
                                                            ? "bg-blue-100 border-l-3 border-blue-600"
                                                            : "hover:bg-gray-100"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div
                                                                    className={`font-medium truncate text-sm ${
                                                                        currentChatId ===
                                                                        chat.id
                                                                            ? "text-blue-800"
                                                                            : "text-gray-800"
                                                                    }`}
                                                                >
                                                                    {chat.title}
                                                                </div>
                                                                {chat.unread && (
                                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-600 truncate mb-1">
                                                                {
                                                                    chat.lastMessage
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {chat.timestamp}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {currentChatId ===
                                                        chat.id && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Profile Section */}
                            <div className="border-t border-gray-200 p-4 bg-white">
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setShowProfileDropdown(
                                                !showProfileDropdown
                                            )
                                        }
                                        className="group w-full flex items-center gap-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
                                    >
                                        <>
                                            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                                {!session.user?.image ? (
                                                    <User className="text-white size-4" />
                                                ) : (
                                                    <Image
                                                        src={
                                                            session?.user
                                                                ?.image!
                                                        }
                                                        alt="User Image"
                                                        width={64}
                                                        height={64}
                                                        className="rounded-full"
                                                    />
                                                )}
                                            </div>

                                            {sidebarOpen && (
                                                <div className="flex-1 text-left">
                                                    <div className="font-semibold text-gray-800 text-sm">
                                                        {session.user?.name}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        {session.user?.email?.length! > 25
                                                            ? `${session.user?.email?.substring(
                                                                  0,
                                                                  22
                                                              )}...`
                                                            : session.user?.email}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-col w-full">
                    <header className="flex items-center justify-between p-5 bg-white border-b border-gray-200 shadow-sm">
                        <div className="flex gap-4">
                            {/* Mobile Menu Button */}
                            {status === "authenticated" && (
                                <button
                                    className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 md:hidden"
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                >
                                    <Menu className="size-5" />
                                </button>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 text-md">
                                    Medical Graph RAG
                                </span>
                            </div>
                        </div>
                        {status !== "authenticated" && (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => signIn("google")}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </header>
                    <div className="flex-1">{children}</div>

                    {/* Footer */}
                    {/* <footer className="px-6 py-6 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                        © {new Date().getFullYear()} Medical Assistant. All
                        rights reserved.
                    </footer> */}
                </div>
            </div>

            {showProfileDropdown && (
                <div className="absolute z-50 bottom-15 left-5 mb-2 bg-white w-40 rounded-lg shadow-lg border border-gray-300">
                    <div className="p-1">
                        <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 transition-all duration-200 rounded-md text-left">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                                Profile
                            </span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 transition-all duration-200 rounded-md text-left">
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                                Settings
                            </span>
                        </button>
                        <hr className="my-1 border-gray-200" />
                        <button onClick={() => signOut()} className="w-full flex items-center gap-3 p-2 hover:bg-red-50 transition-all duration-200 rounded-md text-left">
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600">
                                Sign out
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
