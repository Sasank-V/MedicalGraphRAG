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
// Removed unused Message import

const backendURL = process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL;

type ServerReference = {
  file_id?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  page_range?: [number, number] | [string, string] | string | null;
  chunk_id?: number | null;
  score?: number | null;
  text?: string | null;
  source?: string | null; // 'vector_db' | 'graph_db'
};

const ChatPage = () => {
  const { chatId } = useParams();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const autoSubmitQuery = searchParams.get("autoSubmit");
  const hasAutoSubmitted = useRef(false);
  const referencesRef = useRef<ServerReference[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
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
        referencesRef.current = [];
        setStatusMessages([]);
        setIsStreaming(true);

        const res = await fetch(`${backendURL}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to create query job");
        const { job_id } = (await res.json()) as { job_id: string };

        const poll = async () => {
          try {
            const r = await fetch(`${backendURL}/jobs/${job_id}`);
            if (!r.ok) return;
            const job = await r.json();
            if (Array.isArray(job.messages)) setStatusMessages(job.messages);
            if (Array.isArray(job.references)) {
              referencesRef.current = job.references as ServerReference[];
            }
            if (job.status === "finished") {
              const content: string = job?.result?.content || "";
              const refs: ServerReference[] = (job?.result?.references ||
                []) as ServerReference[];

              // Strip inline sources and number
              const extracted = extractAndNumberSources(content);
              const cleanContent = extracted.text;

              // Build source docs similar to previous logic
              let finalSourceDocs: {
                title: string;
                url: string;
                pages?: string;
                excerpt?: string;
                source?: string;
                text?: string;
              }[] = [];

              const normalizePages = (
                pr: ServerReference["page_range"]
              ): string | undefined => {
                if (Array.isArray(pr) && pr.length === 2) {
                  return `${pr[0]}-${pr[1]}`;
                }
                if (typeof pr === "string") return pr;
                return undefined;
              };

              const trimExcerpt = (t?: string | null) => {
                const str = (t || "").trim();
                if (!str) return undefined;
                return str.length > 220 ? `${str.slice(0, 220)}…` : str;
              };

              if (refs.length && extracted.sources?.length) {
                const serverMap = new Map<
                  string,
                  {
                    url: string;
                    pages?: string;
                    excerpt?: string;
                    source?: string;
                    title?: string;
                    text?: string;
                  }
                >();
                refs.forEach((ref) => {
                  const pagesStr = normalizePages(ref.page_range);
                  const url = ref.file_url || "";
                  const key = `${url}|${pagesStr || ""}`;
                  if (!serverMap.has(key)) {
                    serverMap.set(key, {
                      url: url || "#",
                      pages: pagesStr,
                      excerpt: trimExcerpt(ref.text),
                      source: ref.source || undefined,
                      title: ref.file_name || undefined,
                      text: ref.text || undefined,
                    });
                  }
                });
                const mappedDocs = extracted.sources.map((src, i) => {
                  const key = `${src.url}|${src.pages || ""}`;
                  let match = serverMap.get(key);
                  if (!match) {
                    const fb = refs[i];
                    if (fb && fb.file_url) {
                      match = {
                        url: (fb.file_url as string) || "#",
                        pages: normalizePages(fb.page_range),
                        excerpt: trimExcerpt(fb.text),
                        source: fb.source || undefined,
                        title: fb.file_name || undefined,
                        text: fb.text || undefined,
                      };
                    }
                  }
                  const url = match?.url || src.url || "#";
                  const pages = match?.pages || src.pages;
                  const excerpt = match?.excerpt;
                  const source = match?.source;
                  const title = match?.title || `Reference [${i + 1}]`;
                  const text = match?.text;
                  return { title, url, pages, excerpt, source, text };
                });
                const graphOnly = refs.filter(
                  (r) => r.source === "graph_db" || !r.file_url
                );
                const graphDocs = graphOnly.map((ref) => ({
                  title: ref.file_name || "Graph Database",
                  url: ref.file_url || "#",
                  pages: normalizePages(ref.page_range),
                  excerpt: trimExcerpt(ref.text),
                  source: ref.source || "graph_db",
                  text: ref.text || undefined,
                }));
                finalSourceDocs = [...mappedDocs, ...graphDocs];
              } else if (extracted.sources?.length) {
                finalSourceDocs = extracted.sources.map((src, i) => ({
                  title: `Reference [${i + 1}]`,
                  url: src.url || "#",
                  pages: src.pages,
                }));
              } else if (refs.length) {
                const seen = new Set<string>();
                const unique = refs.filter((ref) => {
                  const pagesStr = normalizePages(ref.page_range) || "";
                  const key = `${ref.file_url || ""}|${pagesStr}`;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });
                finalSourceDocs = unique.map((ref, i) => ({
                  title:
                    (ref.source === "graph_db" &&
                      (ref.file_name || "Graph Database")) ||
                    ref.file_name ||
                    `Reference [${i + 1}]`,
                  url: ref.file_url || "#",
                  pages: normalizePages(ref.page_range),
                  excerpt: trimExcerpt(ref.text),
                  source: ref.source || undefined,
                  text: ref.text || undefined,
                }));
              }

              updateLastAssistantMessage(cleanContent, finalSourceDocs);
              addMessageToDb(chatId as string, {
                ...aiMsg,
                content: cleanContent || "",
                sourceDocs: finalSourceDocs,
              });
              if (pollRef.current) clearInterval(pollRef.current);
              setIsStreaming(false);
            } else if (job.status === "failed") {
              updateLastAssistantMessage(
                (prev) =>
                  prev +
                  `\n\n[Error] ${
                    job.error_message || job.message || "Query failed"
                  }`
              );
              if (pollRef.current) clearInterval(pollRef.current);
              setIsStreaming(false);
            }
          } catch (e) {
            console.error(e);
          }
        };
        await poll();
        pollRef.current = setInterval(poll, 1000);
      } catch (err) {
        console.error("Error in handleSubmit:", err);
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

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
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
