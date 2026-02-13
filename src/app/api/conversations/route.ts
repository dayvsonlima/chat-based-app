import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Nao autorizado", { status: 401 });
  }

  const userConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, session.user.id))
    .orderBy(desc(conversations.updatedAt));

  return Response.json(userConversations);
}
