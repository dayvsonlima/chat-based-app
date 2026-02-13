"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useMemo } from "react";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { UsageIndicator } from "@/components/chat/usage-indicator";

export default function ChatPage() {
  const conversationIdRef = useRef<string | null>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSend = async (text: string) => {
    await sendMessage({ text });
  };

  return (
    <>
      <ChatMessages messages={messages} isLoading={isLoading} />
      {error && (
        <div className="px-4 py-2 text-center text-sm text-danger">
          {error.message || "Ocorreu um erro. Tente novamente."}
        </div>
      )}
      <UsageIndicator />
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </>
  );
}
