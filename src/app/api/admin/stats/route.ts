import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, messages, conversations, transactions } from "@/lib/db/schema";
import { count, sum, sql, and, eq, gte, inArray } from "drizzle-orm";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [totalMessages] = await db.select({ count: count() }).from(messages);
  const [totalConversations] = await db
    .select({ count: count() })
    .from(conversations);
  const [totalRevenue] = await db
    .select({ total: sum(transactions.amountBrl) })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, "completed"),
        inArray(transactions.type, ["purchase", "subscription"])
      )
    );

  const kpis = {
    totalUsers: totalUsers.count,
    totalMessages: totalMessages.count,
    totalConversations: totalConversations.count,
    totalRevenue: Number(totalRevenue.total ?? 0),
  };

  const messagesPerDay = await db
    .select({
      date: sql<string>`DATE(${messages.createdAt})`.as("date"),
      count: count(),
    })
    .from(messages)
    .where(gte(messages.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${messages.createdAt})`)
    .orderBy(sql`DATE(${messages.createdAt})`);

  const usersPerDay = await db
    .select({
      date: sql<string>`DATE(${users.createdAt})`.as("date"),
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt})`);

  const usersResult = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.plan,
      u.role,
      u.credit_balance AS "creditBalance",
      u.daily_usage_count AS "dailyUsageCount",
      u.created_at AS "createdAt",
      COALESCE(msg_stats.total_messages, 0)::int AS "totalMessages",
      COALESCE(msg_stats.total_tokens, 0)::bigint AS "totalTokens",
      COALESCE(conv_stats.total_conversations, 0)::int AS "totalConversations",
      msg_stats.last_active AS "lastActive"
    FROM users u
    LEFT JOIN (
      SELECT c.user_id,
        COUNT(m.id) AS total_messages,
        SUM(COALESCE(m.tokens_used, 0)) AS total_tokens,
        MAX(m.created_at) AS last_active
      FROM conversations c
      JOIN messages m ON m.conversation_id = c.id
      GROUP BY c.user_id
    ) msg_stats ON msg_stats.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS total_conversations
      FROM conversations
      GROUP BY user_id
    ) conv_stats ON conv_stats.user_id = u.id
    ORDER BY u.created_at DESC
  `);
  const usersList = usersResult.rows;

  return NextResponse.json({
    kpis,
    charts: { messagesPerDay, usersPerDay },
    users: usersList,
  });
}
