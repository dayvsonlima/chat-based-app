"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import type { PlanType } from "@/lib/billing/plans";

interface PlanInfo {
  plan: PlanType;
  creditBalance: number;
}

export function UsageIndicator() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((res) => res.json())
      .then(setPlanInfo)
      .catch(() => {});
  }, []);

  if (!planInfo) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted px-4 py-2 border-t border-border">
      <Zap className="w-3 h-3" />
      {planInfo.plan === "free" && <span>Plano gratuito</span>}
      {planInfo.plan === "credits" && (
        <span>{planInfo.creditBalance} creditos restantes</span>
      )}
      {planInfo.plan === "unlimited" && <span>Plano ilimitado</span>}
    </div>
  );
}
