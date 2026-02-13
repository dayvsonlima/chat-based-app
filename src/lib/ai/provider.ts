import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ModelProvider = "openai" | "anthropic";

export function getModel(provider: ModelProvider = "openai") {
  switch (provider) {
    case "openai":
      return openai("gpt-4o-mini");
    case "anthropic":
      return anthropic("claude-sonnet-4-5-20250929");
    default:
      return openai("gpt-4o-mini");
  }
}

export const SYSTEM_PROMPT = `Voce e um assistente de IA prestativo, preciso e amigavel. Responda de forma clara e concisa. Se nao souber algo, diga honestamente.`;
