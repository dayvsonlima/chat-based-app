import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { getPriceId } from "@/lib/billing/plans";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return new Response("Nao autorizado", { status: 401 });
  }

  const { packageId } = await req.json();

  const priceId = getPriceId(packageId);
  if (!priceId) {
    return new Response("Pacote invalido", { status: 400 });
  }

  const isSubscription = packageId === "unlimited";

  const checkoutSession = await createCheckoutSession({
    userId: session.user.id,
    email: session.user.email,
    priceId,
    mode: isSubscription ? "subscription" : "payment",
  });

  return Response.json({ url: checkoutSession.url });
}
