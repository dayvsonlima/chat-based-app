import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const freePlanLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(20, "1d"),
  prefix: "selene:free",
});

export { redis };
