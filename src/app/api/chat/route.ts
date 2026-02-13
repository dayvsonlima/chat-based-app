import { streamText } from "ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { getModel, SYSTEM_PROMPT } from "@/lib/ai/provider";
import { checkUsage, recordUsage, getUserPlan } from "@/lib/billing/usage";

interface ChatMessagePart {
  type: string;
  text?: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: ChatMessagePart[];
}

function getTextContent(msg: ChatMessage): string {
  if (msg.content) return msg.content;
  if (msg.parts) {
    return msg.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("");
  }
  return "";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Nao autorizado", { status: 401 });
  }

  const userId = session.user.id;
  const { messages: chatMessages, conversationId } = await req.json();

  const { plan } = await getUserPlan(userId);
  const usageCheck = await checkUsage(userId, plan);

  if (!usageCheck.allowed) {
    return new Response(JSON.stringify({ error: usageCheck.reason }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lastUserMessage: ChatMessage | undefined =
    chatMessages[chatMessages.length - 1];
  const lastUserText = lastUserMessage ? getTextContent(lastUserMessage) : "";

  let convId = conversationId;
  if (!convId) {
    const title = lastUserText.slice(0, 100) || "Nova conversa";

    const [conv] = await db
      .insert(conversations)
      .values({ userId, title })
      .returning({ id: conversations.id });

    convId = conv.id;
  }

  if (lastUserMessage?.role === "user" && lastUserText) {
    await db.insert(messages).values({
      conversationId: convId,
      role: "user",
      content: lastUserText,
    });
  }

  // Converter para formato que streamText aceita (role + content)
  const aiMessages = chatMessages.map((msg: ChatMessage) => ({
    role: msg.role,
    content: getTextContent(msg),
  }));

  const result = streamText({
    model: getModel("openai"),
    system: SYSTEM_PROMPT,
    messages: aiMessages,
    async onFinish({ text, usage }) {
      await db.insert(messages).values({
        conversationId: convId,
        role: "assistant",
        content: text,
        tokensUsed: usage.totalTokens,
      });

      await recordUsage(userId, plan);
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "X-Conversation-Id": convId,
    },
  });
}
