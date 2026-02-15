import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
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

  await db
    .delete(conversations)
    .where(eq(conversations.id, id));

  return new Response(null, { status: 200 });
}
