/**
 * Example usage of the RAG Query API with SSE streaming
 *
 * This file demonstrates how to:
 * 1. Submit a query to the RAG system
 * 2. Connect to the SSE stream to receive real-time tokens
 * 3. Handle different event types
 * 4. Save the final answer to the chat
 */

import { useState } from "react";

export interface SourceDocument {
  text: string;
  score: number;
  metadata: Record<string, unknown>;
  source: "vector" | "graph";
}

interface QueryRequest {
  query: string;
  chatId?: string; // Optional: for chat context
  fileId?: string; // Optional: search specific file only
  topK?: number; // Optional: number of results (default: 5)
  userId?: string; // Optional: for tracking purposes
}

interface QueryResponse {
  job_id: string;
  stream_url: string;
  status: string;
  message: string;
}

interface SSEEvent {
  type: "connected" | "token" | "context" | "done" | "error";
  content?: string;
  answer?: string;
  sources?: SourceDocument[];
  error?: string;
}

/**
 * Submit a query and get streaming response
 */
export async function submitQueryWithStream(
  request: QueryRequest,
  onToken: (token: string) => void,
  onComplete: (answer: string, sources: SourceDocument[]) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    // Step 1: Submit query
    console.log("[Client] Submitting query:", request.query);
    const response = await fetch("/api/rag/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Query submission failed: ${response.statusText}`);
    }

    const { job_id, stream_url }: QueryResponse = await response.json();
    console.log("[Client] Query enqueued, job_id:", job_id);

    // Step 2: Connect to SSE stream
    const eventSource = new EventSource(
      `${stream_url}?job_id=${encodeURIComponent(job_id)}`
    );

    let fullAnswer = "";
    let sources: SourceDocument[] = [];

    eventSource.onopen = () => {
      console.log("[Client] SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        console.log("[Client] SSE event:", data.type);

        switch (data.type) {
          case "connected":
            console.log("[Client] Connected to stream");
            break;

          case "token":
            // Stream individual tokens to UI
            if (data.content) {
              fullAnswer += data.content;
              onToken(data.content);
            }
            break;

          case "context":
            // Context chunks retrieved (optional)
            console.log("[Client] Context retrieved");
            break;

          case "done":
            // Query complete
            console.log("[Client] Query complete");
            if (data.answer) {
              fullAnswer = data.answer;
            }
            if (data.sources) {
              sources = data.sources;
            }
            onComplete(fullAnswer, sources);
            eventSource.close();
            break;

          case "error":
            console.error("[Client] Stream error:", data.error);
            onError(data.error || "Unknown error");
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error("[Client] Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[Client] SSE connection error:", error);
      onError("Stream connection failed");
      eventSource.close();
    };
  } catch (error) {
    console.error("[Client] Query error:", error);
    onError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Save query result to chat
 */
async function saveToChat(
  chatId: string,
  userQuery: string,
  assistantAnswer: string,
  sources: SourceDocument[]
) {
  try {
    // Save user message
    await fetch(`/api/chat/${chatId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "user",
        content: userQuery,
      }),
    });

    // Save assistant message with sources
    await fetch(`/api/chat/${chatId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "assistant",
        content: assistantAnswer,
        sourceDocs: sources.map((s) => ({
          title: s.metadata?.file_name || "Unknown",
          snippet: s.text.substring(0, 200),
          url: s.metadata?.file_url || "#",
        })),
      }),
    });

    console.log("[Client] Messages saved to chat");
  } catch (error) {
    console.error("[Client] Failed to save to chat:", error);
  }
}

/**
 * React Hook example usage
 */
export function useRAGQuery() {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submitQuery = async (
    query: string,
    options?: {
      chatId?: string;
      fileId?: string;
      topK?: number;
      userId?: string;
    }
  ) => {
    setIsLoading(true);
    setStreamingAnswer("");
    setError(null);

    await submitQueryWithStream(
      {
        query,
        ...options,
      },
      // onToken
      (token) => {
        setStreamingAnswer((prev) => prev + token);
      },
      // onComplete
      async (answer) => {
        setIsLoading(false);
        setStreamingAnswer(answer);

        // Note: Messages are automatically saved by queryWorker if chatId is provided
        // No need to manually save here
      },
      // onError
      (errorMessage) => {
        setIsLoading(false);
        setError(errorMessage);
      }
    );
  };

  return {
    submitQuery,
    isLoading,
    streamingAnswer,
    error,
  };
}

/**
 * Simple usage example (vanilla JS)
 */
export async function exampleUsage() {
  const userQuery = "What are the symptoms of diabetes?";
  const userId = "user123";
  const chatId = "chat456";

  await submitQueryWithStream(
    { query: userQuery, userId, chatId, topK: 5 },
    // Handle each token
    (token) => {
      console.log("Token:", token);
      // Update UI here: appendToMessageBubble(token)
    },
    // Handle completion
    async (fullAnswer, sources) => {
      console.log("Complete answer:", fullAnswer);
      console.log("Sources:", sources);

      // Save to chat
      await saveToChat(chatId, userQuery, fullAnswer, sources);
    },
    // Handle errors
    (error) => {
      console.error("Error:", error);
      // Show error in UI
    }
  );
}
