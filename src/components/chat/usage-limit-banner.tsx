"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

interface UsageLimitBannerProps {
  message: string;
}

export function UsageLimitBanner({ message }: UsageLimitBannerProps) {
  return (
    <div className="mx-4 mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Sparkles className="w-8 h-8 text-primary" />
        <p className="text-sm text-foreground">{message}</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Ver planos e continuar conversando
        </Link>
      </div>
    </div>
  );
}
