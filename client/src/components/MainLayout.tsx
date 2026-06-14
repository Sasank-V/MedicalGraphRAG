"use client";

import {
  LogOut,
  Plus,
  Settings,
  User,
  Menu,
  MessageCircle,
  ChevronLeft,
} from "lucide-react";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { IChat, IUser } from "@/lib/types";
import { redirect, usePathname } from "next/navigation";
import { useUserDetailsStore } from "@/stores/userDetailsStore";
import { getUserFromDb } from "@/lib/apiUtils";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const { chats, setChats, activeChat, setActiveChat, setIsAdmin } =
    useUserDetailsStore();

  const loadChat = (chatId: string) => {
    setActiveChat(chatId);
    redirect(`/chat/${chatId}`);
  };

  useEffect(() => {
    const getChats = async () => {
      if (!session?.user?.email) return;

      const user = (await getUserFromDb(session?.user?.email)) as IUser;

      if (!user) return;

      console.log(user.role === "admin");

      setIsAdmin(user.role === "admin");

      if (!user.chats) {
        setChats([]);
        return;
      }

      setChats(user.chats);
    };

    getChats();
  }, [session, status, setChats, setIsAdmin]);

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      className="p-3 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200 mx-auto"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                      <Menu className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* New Chat Button */}
              <div className="p-4 w-full h-fit">
                <button
                  className={`group overflow-hidden cursor-pointer h-full w-full bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-sm ${
                    sidebarOpen ? "w-full" : "size-10 mx-auto"
                  }`}
                >
                  <Link
                    href="/chat"
                    className="flex items-center justify-center gap-2 w-full h-full p-3"
                  >
                    <Plus className="size-4 text-white" />
                    {sidebarOpen && (
                      <span className="font-medium text-white text-sm">
                        New Chat
                      </span>
                    )}
                  </Link>
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
                      {chats?.map((chat: IChat) => (
                        <button
                          key={chat._id}
                          onClick={() => loadChat(chat._id)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                            pathname === `/chat/${chat._id}`
                              ? "bg-blue-100 border-l-3 border-blue-600"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className={`font-medium truncate text-sm ${
                                    activeChat === chat._id
                                      ? "text-blue-800"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {chat.title}
                                </div>
                                {/* {chat.unread && (
                                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                )} */}
                              </div>
                              <div className="text-xs text-gray-500">
                                {timeAgo(
                                  chat.lastUpdated?.toString() ??
                                    new Date().toISOString()
                                )}
                              </div>
                            </div>
                          </div>

                          {activeChat === chat._id && (
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
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="group w-full flex items-center gap-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  >
                    <>
                      <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        {!session.user?.image ? (
                          <User className="text-white size-4" />
                        ) : (
                          <Image
                            src={session?.user?.image ?? ""}
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
                            {(session.user?.email?.length ?? 0) > 25
                              ? `${session.user?.email?.substring(0, 22)}...`
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
          <div className="w-full h-full justify-center items-center flex">
            {children}
          </div>

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
              <span className="text-sm text-gray-700">Profile</span>
            </button>
            <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 transition-all duration-200 rounded-md text-left">
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Settings</span>
            </button>
            <hr className="my-1 border-gray-200" />
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 p-2 hover:bg-red-50 transition-all duration-200 rounded-md text-left"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MainLayout;
