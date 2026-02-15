import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  conversations,
  messages,
  transactions,
} from "@/lib/db/schema";
import { eq, sql, count, sum, gte, desc, and } from "drizzle-orm";

const VALID_PLANS = ["free", "credits", "unlimited"] as const;
const VALID_ROLES = ["user", "admin"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Aggregate stats
  const [msgStats] = await db
    .select({
      totalMessages: count(),
      totalTokens: sum(messages.tokensUsed),
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, id));

  const [convStats] = await db
    .select({ totalConversations: count() })
    .from(conversations)
    .where(eq(conversations.userId, id));

  const [lastMsg] = await db
    .select({ lastActive: sql<string>`MAX(${messages.createdAt})` })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, id));

  // First message date for avg calculation
  const [firstMsg] = await db
    .select({ firstActive: sql<string>`MIN(${messages.createdAt})` })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, id));

  const totalMessages = msgStats.totalMessages ?? 0;
  const firstActiveDate = firstMsg?.firstActive
    ? new Date(firstMsg.firstActive)
    : null;
  const daysSinceFirst = firstActiveDate
    ? Math.max(
        1,
        Math.ceil(
          (Date.now() - firstActiveDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 1;
  const avgMessagesPerDay = Number((totalMessages / daysSinceFirst).toFixed(1));

  // Messages per day (last 30 days)
  const messagesPerDay = await db
    .select({
      date: sql<string>`DATE(${messages.createdAt})`.as("date"),
      count: count(),
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, id),
        gte(messages.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(sql`DATE(${messages.createdAt})`)
    .orderBy(sql`DATE(${messages.createdAt})`);

  // Messages per hour of day (last 90 days) — usage pattern
  const messagesByHour = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${messages.createdAt})::int`.as(
        "hour"
      ),
      count: count(),
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, id),
        gte(messages.createdAt, ninetyDaysAgo)
      )
    )
    .groupBy(sql`EXTRACT(HOUR FROM ${messages.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${messages.createdAt})`);

  // Messages per day of week (last 90 days)
  const messagesByWeekday = await db
    .select({
      day: sql<number>`EXTRACT(DOW FROM ${messages.createdAt})::int`.as("day"),
      count: count(),
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, id),
        gte(messages.createdAt, ninetyDaysAgo)
      )
    )
    .groupBy(sql`EXTRACT(DOW FROM ${messages.createdAt})`)
    .orderBy(sql`EXTRACT(DOW FROM ${messages.createdAt})`);

  // Recent conversations with message count
  const recentConversations = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      messageCount: count(messages.id),
      lastMessageAt: sql<string>`MAX(${messages.createdAt})`,
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, id))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt))
    .limit(20);

  // Transaction history
  const transactionHistory = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      credits: transactions.credits,
      amountBrl: transactions.amountBrl,
      status: transactions.status,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.userId, id))
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      plan: user.plan,
      role: user.role,
      creditBalance: user.creditBalance,
      dailyUsageCount: user.dailyUsageCount,
      createdAt: user.createdAt,
    },
    stats: {
      totalMessages,
      totalTokens: Number(msgStats.totalTokens ?? 0),
      totalConversations: convStats.totalConversations,
      avgMessagesPerDay,
      lastActive: lastMsg?.lastActive ?? null,
      firstActive: firstMsg?.firstActive ?? null,
    },
    charts: {
      messagesPerDay,
      messagesByHour,
      messagesByWeekday,
    },
    recentConversations,
    transactions: transactionHistory,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};

  if (body.plan !== undefined) {
    if (!VALID_PLANS.includes(body.plan)) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }
    updates.plan = body.plan;
  }

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Role inválido" }, { status: 400 });
    }
    updates.role = body.role;
  }

  if (body.creditBalance !== undefined) {
    const credits = Number(body.creditBalance);
    if (isNaN(credits) || credits < 0) {
      return NextResponse.json(
        { error: "Créditos inválidos" },
        { status: 400 }
      );
    }
    updates.creditBalance = credits;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Nenhum campo para atualizar" },
      { status: 400 }
    );
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      plan: users.plan,
      role: users.role,
      creditBalance: users.creditBalance,
      dailyUsageCount: users.dailyUsageCount,
      createdAt: users.createdAt,
    });

  if (!updated) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}
