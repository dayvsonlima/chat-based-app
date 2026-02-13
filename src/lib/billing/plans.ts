export const PLANS = {
  free: {
    name: "Gratuito",
    description: "20 mensagens por dia",
    dailyLimit: 20,
    price: 0,
  },
  credits: {
    name: "Creditos",
    description: "Compre creditos e use quando quiser",
    packages: [
      {
        id: "small",
        credits: 100,
        price: 990,
        label: "100 creditos",
        priceLabel: "R$ 9,90",
      },
      {
        id: "medium",
        credits: 500,
        price: 3990,
        label: "500 creditos",
        priceLabel: "R$ 39,90",
      },
      {
        id: "large",
        credits: 2000,
        price: 9990,
        label: "2.000 creditos",
        priceLabel: "R$ 99,90",
      },
    ],
  },
  unlimited: {
    name: "Ilimitado",
    description: "Uso ilimitado por mes",
    price: 4990,
    priceLabel: "R$ 49,90/mes",
  },
} as const;

export const CREDIT_COST_PER_MESSAGE = 1;

export type PlanType = "free" | "credits" | "unlimited";

export function getPriceId(packageId: string): string {
  const priceMap: Record<string, string> = {
    small: process.env.STRIPE_PRICE_CREDITS_SMALL!,
    medium: process.env.STRIPE_PRICE_CREDITS_MEDIUM!,
    large: process.env.STRIPE_PRICE_CREDITS_LARGE!,
    unlimited: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY!,
  };
  return priceMap[packageId];
}
