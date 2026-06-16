"use client";

import { DoorOpen, MessageCircle, Plus, Upload } from "lucide-react";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { IChat, IUser } from "@/lib/types";
import { usePathname } from "next/navigation";
import { useUserDetailsStore } from "@/stores/userDetailsStore";
import { getUserFromDb } from "@/lib/apiUtils";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

// Custom Medical Sidebar Component
function MedicalSidebar() {
  const { data: session } = useSession();
  // console.log(session?.user.role);
  const pathname = usePathname();
  const { chats, setChats, setActiveChat, setIsAdmin, isAdmin } =
    useUserDetailsStore();

  useEffect(() => {
    const getChats = async () => {
      if (!session?.user?.email) return;

      const user = (await getUserFromDb(session?.user?.email)) as IUser;
      if (!user) return;

      setIsAdmin(user.role === "admin");
      setChats(user.chats || []);
    };

    getChats();
  }, [session, setChats, setIsAdmin]);

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

  const loadChat = (chatId: string) => {
    setActiveChat(chatId);
    window.location.href = `/chat/${chatId}`;
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-blue-200 bg-gradient-to-b from-blue-50 to-white"
    >
      <SidebarHeader className="border-b border-blue-200 bg-white/80 backdrop-blur">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="md:h-8 p-5 hover:bg-blue-50"
            >
              <Link href={status === "authenticated" ? "/chat" : "/"}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Image src={"/logo.svg"} width={16} height={16} alt="logo" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-blue-900">
                    MedGPT
                  </span>
                  <span className="truncate text-xs text-blue-700">
                    AI Assistant
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* New Chat Button */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="hover:bg-blue-50 hover:text-blue-800"
              >
                <Link
                  href="/chat"
                  className="flex items-center gap-2 text-blue-700"
                >
                  <Plus className="size-4" />
                  <span>New Chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-700">
              Admin
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="hover:bg-blue-50 hover:text-blue-800"
                >
                  <Link
                    href="/upload"
                    className="flex items-center gap-2 text-blue-700"
                  >
                    <Upload className="size-4" />
                    <span>Upload PDFs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Recent Chats */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-700">
            Recent Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats?.toReversed().map((chat: IChat) => (
                <SidebarMenuItem key={chat._id}>
                  <SidebarMenuButton
                    onClick={() => loadChat(chat._id)}
                    isActive={pathname === `/chat/${chat._id}`}
                    className={`flex flex-col items-start gap-1 h-auto py-2 hover:bg-blue-50 hover:text-blue-800 ${
                      pathname === `/chat/${chat._id}`
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : ""
                    }`}
                  >
                    <span className="truncate text-sm font-medium">
                      {chat.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(
                        chat.lastUpdated?.toString() ?? new Date().toISOString()
                      )}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={session?.user?.image ?? ""}
                      alt={session?.user?.name ?? ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {session?.user?.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.name}
                    </span>
                    <span className="truncate text-xs">
                      {session?.user?.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="right" align="end">
                <DropdownMenuItem onClick={() => signOut()}>
                  <DoorOpen className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();
  const pathname = usePathname();

  // Dynamic page title based on current route
  const getPageTitle = () => {
    if (pathname === "/chat" || pathname.startsWith("/chat/")) return "Chat";
    if (pathname === "/upload") return "Upload PDFs";
    return "MedGPT";
  };

  if (status === "authenticated") {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <MedicalSidebar />
          <SidebarInset className="flex flex-col">
            {/* Translucent Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <div className="h-4 w-px bg-border mx-2" />
                  <h1 className="text-lg font-semibold text-blue-900">
                    {getPageTitle()}
                  </h1>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Non-authenticated layout
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default MainLayout;
