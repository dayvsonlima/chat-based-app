"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { UsageIndicator } from "@/components/chat/usage-indicator";
import { UsageLimitBanner } from "@/components/chat/usage-limit-banner";

function parseLimitError(error: Error | undefined): string | null {
  if (!error) return null;
  try {
    const parsed = JSON.parse(error.message);
    if (parsed.code === "USAGE_LIMIT") return parsed.error;
  } catch {}
  return null;
}

export default function ChatPage() {
  const router = useRouter();
  const conversationIdRef = useRef<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const response = await globalThis.fetch(input, init);
          const newConvId = response.headers.get("X-Conversation-Id");
          if (newConvId) {
            conversationIdRef.current = newConvId;
          }
          return response;
        },
      }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onFinish: () => {
      const convId = conversationIdRef.current;
      if (convId) {
        router.replace(`/chat/${convId}`);
      }
    },
  });

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
