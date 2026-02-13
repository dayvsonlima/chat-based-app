import { db } from "@/lib/db";
import { users, transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function addCredits(userId: string, credits: number, gatewayTransactionId: string, amountBrl: number) {
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        creditBalance: sql`${users.creditBalance} + ${credits}`,
        plan: "credits",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await tx.insert(transactions).values({
      userId,
      type: "purchase",
      credits,
      amountBrl,
      gatewayTransactionId,
      status: "completed",
    });
  });
}

export async function debitCredits(userId: string, creditsUsed: number) {
  const [user] = await db
    .update(users)
    .set({
      creditBalance: sql`GREATEST(${users.creditBalance} - ${creditsUsed}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ creditBalance: users.creditBalance });

  return user.creditBalance;
}

export async function getUserCredits(userId: string): Promise<number> {
  const [user] = await db
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.id, userId));

  return user?.creditBalance ?? 0;
}
