"use client";

import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { User, Bot } from "lucide-react";

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Bot className="w-12 h-12 text-muted mx-auto" />
          <h2 className="text-xl font-semibold">Como posso ajudar?</h2>
          <p className="text-muted text-sm max-w-md">
            Pergunte qualquer coisa. Estou aqui para ajudar com duvidas,
            ideias, textos, codigo e muito mais.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3 max-w-3xl mx-auto",
            message.role === "user" && "flex-row-reverse"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              message.role === "user"
                ? "bg-primary"
                : "bg-card border border-border"
            )}
          >
            {message.role === "user" ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
          <div
            className={cn(
              "rounded-xl px-4 py-3 text-sm leading-relaxed",
              message.role === "user"
                ? "bg-primary text-white"
                : "bg-card border border-border"
            )}
          >
            <div className="whitespace-pre-wrap">{getMessageText(message)}</div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3 max-w-3xl mx-auto">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-card border border-border">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-muted rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
