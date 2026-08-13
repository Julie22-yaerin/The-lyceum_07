import { NextResponse } from "next/server";
import { chatComplete } from "@/lib/ai/openrouter";

interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

function isAssistantMessage(value: unknown): value is AssistantMessage {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") && typeof v.content === "string";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<{ context: string; messages: unknown[] }>;
    const messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isAssistantMessage)) {
      return NextResponse.json(
        { success: false, error: "messages must be a non-empty array of {role, content}" },
        { status: 400 }
      );
    }

    const systemPrompt =
      "You are a concise study assistant embedded in a short-form video feed called The Lyceum. " +
      "The student is asking about content they're currently watching mid-scroll — answer in 2-4 short " +
      "sentences, plain language, no filler, no markdown headers." +
      (body.context ? ` What they're currently watching: ${body.context}` : "");

    const answer = await chatComplete({
      messages: [{ role: "system", content: systemPrompt }, ...(messages as AssistantMessage[])],
    });

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Assistant failed" },
      { status: 500 }
    );
  }
}
