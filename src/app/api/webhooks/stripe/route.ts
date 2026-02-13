import { headers } from "next/headers";
import { stripe } from "@/lib/billing/stripe";
import { addCredits } from "@/lib/billing/credits";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "@/lib/billing/plans";
import type Stripe from "stripe";

function getSubscriptionPeriod(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return {
    start: item ? new Date(item.current_period_start * 1000) : new Date(),
    end: item ? new Date(item.current_period_end * 1000) : new Date(),
  };
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Webhook signature invalida", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      if (session.mode === "payment") {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );
        const priceId = lineItems.data[0]?.price?.id;

        const creditPackage = PLANS.credits.packages.find(
          (pkg) =>
            process.env[
              `STRIPE_PRICE_CREDITS_${pkg.id.toUpperCase()}`
            ] === priceId
        );

        if (creditPackage) {
          await addCredits(
            userId,
            creditPackage.credits,
            session.id,
            creditPackage.price
          );
        }
      }

      if (session.mode === "subscription") {
        const subscriptionId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const period = getSubscriptionPeriod(sub);

        await db.insert(subscriptions).values({
          userId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: session.customer as string,
          status: "active",
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        });

        await db
          .update(users)
          .set({ plan: "unlimited", updatedAt: new Date() })
          .where(eq(users.id, userId));
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const [existingSub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));

      if (existingSub) {
        const period = getSubscriptionPeriod(sub);
        await db
          .update(subscriptions)
          .set({
            status: sub.status === "active" ? "active" : "past_due",
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const [existingSub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));

      if (existingSub) {
        await db
          .update(subscriptions)
          .set({ status: "canceled", updatedAt: new Date() })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));

        await db
          .update(users)
          .set({ plan: "free", updatedAt: new Date() })
          .where(eq(users.id, existingSub.userId));
      }
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
