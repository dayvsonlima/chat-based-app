import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, conversations } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Nao autorizado", { status: 401 });
  }

  const { id } = await params;

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id)
      )
    );

  if (!conversation) {
    return new Response("Conversa nao encontrada", { status: 404 });
  }

  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  return Response.json(conversationMessages);
}
