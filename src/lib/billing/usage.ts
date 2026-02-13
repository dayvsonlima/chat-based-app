import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { freePlanLimiter } from "@/lib/rate-limit";
import { getUserCredits, debitCredits } from "./credits";
import { CREDIT_COST_PER_MESSAGE } from "./plans";
import type { PlanType } from "./plans";

export type UsageCheckResult =
  | { allowed: true; remaining?: number }
  | { allowed: false; reason: string };

export async function checkUsage(
  userId: string,
  plan: PlanType
): Promise<UsageCheckResult> {
  switch (plan) {
    case "free": {
      const { success, remaining } = await freePlanLimiter.limit(userId);
      if (!success) {
        return {
          allowed: false,
          reason:
            "Limite diario atingido. Faca upgrade para continuar usando.",
        };
      }
      return { allowed: true, remaining };
    }
    case "credits": {
      const balance = await getUserCredits(userId);
      if (balance < CREDIT_COST_PER_MESSAGE) {
        return {
          allowed: false,
          reason: "Creditos insuficientes. Compre mais creditos para continuar.",
        };
      }
      return { allowed: true, remaining: balance };
    }
    case "unlimited":
      return { allowed: true };
    default:
      return { allowed: false, reason: "Plano invalido." };
  }
}

export async function recordUsage(userId: string, plan: PlanType) {
  if (plan === "credits") {
    await debitCredits(userId, CREDIT_COST_PER_MESSAGE);
  }
}

export async function getUserPlan(
  userId: string
): Promise<{ plan: PlanType; creditBalance: number }> {
  const [user] = await db
    .select({ plan: users.plan, creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.id, userId));

  return {
    plan: (user?.plan as PlanType) ?? "free",
    creditBalance: user?.creditBalance ?? 0,
  };
}
