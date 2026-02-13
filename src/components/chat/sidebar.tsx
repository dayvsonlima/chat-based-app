"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  MessageSquare,
  Plus,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/db/schema";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then(setConversations)
      .catch(() => {});
  }, [pathname]);

  return (
    <aside
      className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-3 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <span className="font-semibold text-sm">Selene</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-card-hover rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="p-3">
        <Link
          href="/chat"
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && "Nova conversa"}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors truncate",
              pathname === `/chat/${conv.id}`
                ? "bg-card-hover text-foreground"
                : "text-muted hover:bg-card-hover hover:text-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="truncate">{conv.title}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/pricing"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground transition-colors"
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          {!collapsed && "Planos"}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Sair"}
        </button>
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
