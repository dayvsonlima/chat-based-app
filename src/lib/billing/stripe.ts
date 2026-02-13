import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export async function createCheckoutSession({
  userId,
  email,
  priceId,
  mode,
}: {
  userId: string;
  email: string;
  priceId: string;
  mode: "payment" | "subscription";
}) {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    metadata: { userId },
    line_items: [{ price: priceId, quantity: 1 }],
    mode,
    payment_method_types: ["card"],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return session;
}

export async function createPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return session;
}
