import { IChat, IMessage, IUser } from "@/lib/types";

export const getUserFromDb = async (email: string): Promise<IUser | null> => {
    try {
        const res = await fetch(`/api/user?email=${email}`);

        const user = await res.json();

        return user;
    } catch (err) {
        console.error(err);
        return null;
    }
};

export const getMessagesFromDb = async (
    chatId: string
): Promise<IMessage[]> => {
    try {
        const res = await fetch(`/api/chat/${chatId}`);
        const data: { messages: IMessage[] } = await res.json();
        return data.messages;
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const addMessageToDb = async (
    chatId: string,
    message: IMessage
): Promise<IMessage | null> => {
    try {
        const res = await fetch(`/api/chat/${chatId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });

        const new_message = await res.json();
        return new_message;
    } catch (err) {
        console.error(err);
        return null;
    }
};

export const createNewChat = async (
    email: string,
    first_message: string,
    title: string = ""
): Promise<IChat | null> => {
    try {
        const bodyData = {
            email,
            first_message,
            title,
        };
        const res = await fetch(`/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyData),
        });

        const { chat: new_chat } = await res.json();
        return new_chat;
    } catch (err) {
        console.error(err);
        return null;
    }
};

export interface Source {
  type: string;
  url: string;
  pages?: string;
}

export interface ParsedSources {
  text: string;
  sources: Source[];
  pages?: string;
}

export function extractAndNumberSources(input: string): ParsedSources {
  const sourceBlockRegex = /\[Source: ([^\]]+)\]/g;
  const sources: Source[] = [];
  let counter = 1;

  const newText = input.replace(sourceBlockRegex, (_match, p1) => {
    // p1 example: "string, Pages 1-3, URL: https://...; string, Pages 3-5, URL: https://..."
    const blockSources = p1
      .split(";")
      .map((s: string) => s.trim())
      .filter(Boolean);

    blockSources.forEach((src: string) => {
      const typeMatch = src.split(",")[0].trim();
      const pagesMatch = src.match(/Pages\s*([\d\-–,]+)/i);
      const urlMatch = src.match(/URL:\s*(\S+)/i);

      const type = typeMatch;
      const pages = pagesMatch ? pagesMatch[1].trim() : undefined;
      const url = urlMatch ? urlMatch[1] : "";

      sources.push({ type, url, pages });
    });

    // replace block with numbered references (e.g., [1], [2], ...)
    const ref = `[${counter}]`;
    counter += blockSources.length;
    return ref;
  });

  return { text: newText, sources };
}
