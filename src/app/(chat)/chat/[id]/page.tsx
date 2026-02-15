"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { UsageIndicator } from "@/components/chat/usage-indicator";
import { UsageLimitBanner } from "@/components/chat/usage-limit-banner";
import type { UIMessage } from "ai";

function parseLimitError(error: Error | undefined): string | null {
  if (!error) return null;
  try {
    const parsed = JSON.parse(error.message);
    if (parsed.code === "USAGE_LIMIT") return parsed.error;
  } catch {}
  return null;
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const [loaded, setLoaded] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId: id },
      }),
    [id]
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
  });

  useEffect(() => {
    fetch(`/api/conversations/${id}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch messages");
        return res.json();
      })
      .then((msgs) => {
        const formatted: UIMessage[] = msgs.map(
          (m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: m.content }],
          })
        );
        setMessages(formatted);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [id, setMessages]);

  const isLoading = status === "submitted" || status === "streaming";
  const limit = limitMessage || parseLimitError(error);

  const handleSend = async (text: string) => {
    setLimitMessage(null);
    try {
      await sendMessage({ text });
    } catch (err) {
      if (err instanceof Error) {
        const parsed = parseLimitError(err);
        if (parsed) setLimitMessage(parsed);
      }
    }
  };

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted text-sm">Carregando conversa...</div>
      </div>
    );
  }

  return (
    <>
      <ChatMessages messages={messages} isLoading={isLoading} />
      {limit && <UsageLimitBanner message={limit} />}
      {error && !limit && (
        <div className="px-4 py-2 text-center text-sm text-danger">
          {error.message || "Ocorreu um erro. Tente novamente."}
        </div>
      )}
      <UsageIndicator />
      <ChatInput onSend={handleSend} disabled={isLoading || !!limit} />
    </>
  );
}
