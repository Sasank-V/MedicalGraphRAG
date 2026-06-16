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
import { useEffect, useRef, useCallback } from "react";

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
    async (message: string) => {
      if (!message.trim()) return;

      const userMsg: IMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
        sourceDocs: [],
      };
      addMessage(userMsg);
      addMessageToDb(chatId as string, userMsg);

      // Build payload before adding the empty assistant placeholder
      const payload = {
        query: message,
        top_k: 5,
        model: "gemini",
        user_id: session?.user?.email || "guest_user",
        previous_messages: useChatStore.getState().messages.map((m) => ({
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
        // cancel any in-flight stream
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        referencesRef.current = [];

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
                // ignore in transcript; could render elsewhere if desired
              } else if (parsed.event === "references") {
                // save server-provided references to attach at the end
                if (Array.isArray(parsed.data)) {
                  referencesRef.current = parsed.data;
                }
              } else if (parsed.event === "done") {
                const finalMsg = useChatStore.getState().messages.at(-1);
                let content = finalMsg?.content ?? "";

                // Prefer server-provided references when available
                let finalSourceDocs: {
                  title: string;
                  url: string;
                  pages?: string;
                }[] = [];
                if (referencesRef.current && referencesRef.current.length) {
                  finalSourceDocs = referencesRef.current.map((ref, i) => {
                    let pagesStr: string | undefined;
                    const pr = ref.page_range;
                    if (Array.isArray(pr) && pr.length === 2) {
                      pagesStr = `${pr[0]}-${pr[1]}`;
                    } else if (typeof pr === "string") {
                      pagesStr = pr;
                    }
                    return {
                      title: `Reference [${i + 1}]`,
                      pages: pagesStr,
                      url: ref.file_url || "#",
                    };
                  });
                } else {
                  const extracted = extractAndNumberSources(content);
                  content = extracted.text;
                  finalSourceDocs = (extracted.sources || []).map(
                    (source: { url: string; pages?: string }, i: number) => ({
                      title: `Reference [${i + 1}]`,
                      pages: source.pages,
                      url: source.url,
                    })
                  );
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

  // Abort in-flight stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex justify-center items-center w-full h-full flex-col pb-20 relative">
      <div className="w-full flex justify-center">
        <ConversationComponent messages={messages} />
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
