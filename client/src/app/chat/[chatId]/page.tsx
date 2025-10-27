"use client";

import ChatInput from "@/components/ChatInput";
import ConversationComponent from "@/components/ConversationComponent";
import {
  getMessagesFromDb,
  addMessageToDb,
  extractAndNumberSources,
} from "@/lib/apiUtils";
import { IMessage } from "@/lib/types";
import { useChatStore } from "@/stores/chatStore";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useCallback, useState } from "react";
import { Message } from "../../../components/ai-elements/message";

const backendURL = process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL;

type ServerReference = {
  file_url?: string;
  page_range?: [number, number] | [string, string] | string | null;
};

const ChatPage = () => {
  const { chatId } = useParams();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const autoSubmitQuery = searchParams.get("autoSubmit");
  const hasAutoSubmitted = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const referencesRef = useRef<ServerReference[]>([]);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const {
    messages,
    addMessage,
    setMessages,
    setLoading,
    updateLastAssistantMessage,
  } = useChatStore();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [session, status, router]);

  const handleSubmit = useCallback(
    async (message: string, firstMessage: boolean = false) => {
      if (!message.trim()) return;

      const userMsg: IMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
        sourceDocs: [],
      };
      const messagesSnapshot = [...useChatStore.getState().messages, userMsg];
      if (!firstMessage) {
        // Take a snapshot that includes the new user message to avoid async state lag
        addMessage(userMsg);
        addMessageToDb(chatId as string, userMsg);
      }

      // Build payload before adding the empty assistant placeholder
      const payload = {
        query: message,
        top_k: 5,
        model: "gemini",
        user_id: session?.user?.email || "guest_user",
        previous_messages: messagesSnapshot.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };

      const aiMsg: IMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        sourceDocs: [],
      };
      addMessage(aiMsg);

      try {
        const controller = new AbortController();
        abortRef.current = controller;
        referencesRef.current = [];
        setStatusMessages([]);
        setIsStreaming(true);

        const res = await fetch(`${backendURL}/query-stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.body) return console.error("No response stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (!part.startsWith("data:")) continue;
            const jsonStr = part.replace("data: ", "").trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);

              if (parsed.event === "token") {
                updateLastAssistantMessage((prev) => prev + parsed.data);
              } else if (parsed.event === "status") {
                // surface status updates in a small panel
                if (typeof parsed.data === "string") {
                  setStatusMessages((prev) => [...prev, parsed.data]);
                }
              } else if (parsed.event === "references") {
                // save server-provided references to attach at the end
                if (Array.isArray(parsed.data)) {
                  referencesRef.current = parsed.data;
                }
              } else if (parsed.event === "done") {
                const finalMsg = useChatStore.getState().messages.at(-1);
                let content = finalMsg?.content ?? "";

                // Always strip inline [Source: ...] blocks and insert [n] markers
                const extracted = extractAndNumberSources(content);
                content = extracted.text;

                // Build source docs: dedupe and order by first appearance in extracted.sources
                // If server references exist, map them by (url|pages) and project onto extracted order
                let finalSourceDocs: {
                  title: string;
                  url: string;
                  pages?: string;
                }[] = [];

                const serverRefs = referencesRef.current || [];

                // Helper to normalize a server page_range to string
                const normalizePages = (
                  pr: ServerReference["page_range"]
                ): string | undefined => {
                  if (Array.isArray(pr) && pr.length === 2) {
                    return `${pr[0]}-${pr[1]}`;
                  }
                  if (typeof pr === "string") return pr;
                  return undefined;
                };

                if (serverRefs.length && extracted.sources?.length) {
                  const serverMap = new Map<
                    string,
                    { url: string; pages?: string }
                  >();
                  serverRefs.forEach((ref) => {
                    const pagesStr = normalizePages(ref.page_range);
                    const url = ref.file_url || "";
                    const key = `${url}|${pagesStr || ""}`;
                    if (!serverMap.has(key)) {
                      serverMap.set(key, { url: url || "#", pages: pagesStr });
                    }
                  });

                  finalSourceDocs = extracted.sources.map((src, i) => {
                    const key = `${src.url}|${src.pages || ""}`;
                    const match = serverMap.get(key);
                    const url = match?.url || src.url || "#";
                    const pages = match?.pages || src.pages;
                    return { title: `Reference [${i + 1}]`, url, pages };
                  });
                } else if (extracted.sources?.length) {
                  finalSourceDocs = extracted.sources.map((src, i) => ({
                    title: `Reference [${i + 1}]`,
                    url: src.url || "#",
                    pages: src.pages,
                  }));
                } else if (serverRefs.length) {
                  // No inline source blocks, but server provided references: dedupe and list
                  const seen = new Set<string>();
                  const unique = serverRefs.filter((ref) => {
                    const pagesStr = normalizePages(ref.page_range) || "";
                    const key = `${ref.file_url || ""}|${pagesStr}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  finalSourceDocs = unique.map((ref, i) => ({
                    title: `Reference [${i + 1}]`,
                    url: ref.file_url || "#",
                    pages: normalizePages(ref.page_range),
                  }));
                }

                updateLastAssistantMessage(content, finalSourceDocs);

                addMessageToDb(chatId as string, {
                  ...aiMsg,
                  content: content || "",
                  sourceDocs: finalSourceDocs,
                });
              }
            } catch (err) {
              console.error("Error parsing stream part:", err);
            }
          }
        }
      } catch (err) {
        console.error("Error in handleSubmit:", err);
      } finally {
        setIsStreaming(false);
      }
    },
    [chatId, session?.user?.email, addMessage, updateLastAssistantMessage]
  );

  useEffect(() => {
    const fetchMsgs = async () => {
      setLoading(true);
      const msgs: IMessage[] = await getMessagesFromDb(chatId as string);
      setMessages(msgs || []);
      setLoading(false);
    };
    fetchMsgs();
  }, [chatId, setMessages, setLoading]);

  // Auto-submit the initial query if autoSubmit parameter exists
  useEffect(() => {
    if (
      autoSubmitQuery &&
      !hasAutoSubmitted.current &&
      messages.length === 1 &&
      messages[0]?.role === "user"
    ) {
      hasAutoSubmitted.current = true;
      // Clear the URL parameter
      router.replace(`/chat/${chatId}`);
      // Auto-submit the query
      handleSubmit(autoSubmitQuery);
    }
  }, [autoSubmitQuery, messages, chatId, router, handleSubmit]);

  useEffect(() => {
    if (messages.length == 1) {
      handleSubmit(messages[0].content, true);
    }
  });

  // Abort in-flight stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex justify-center items-center w-full h-full flex-col pb-20 relative">
      <div className="w-full flex justify-center">
        <ConversationComponent
          messages={messages}
          statusMessages={statusMessages}
          isStreaming={isStreaming}
        />
      </div>
      <ChatInput
        handleEnter={(msg) => {
          void handleSubmit(msg);
        }}
        className="absolute bottom-1 w-full justify-center flex"
      />
    </div>
  );
};

export default ChatPage;
