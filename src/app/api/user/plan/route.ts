import { auth } from "@/lib/auth";
import { getUserPlan } from "@/lib/billing/usage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Nao autorizado", { status: 401 });
  }

  const userPlan = await getUserPlan(session.user.id);
  return Response.json(userPlan);
}
