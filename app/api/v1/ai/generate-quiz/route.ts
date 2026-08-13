import { NextResponse } from "next/server";
import { chatComplete } from "@/lib/ai/openrouter";
import type { QuizCardData } from "@/lib/types";

interface GenerateQuizBody {
  topic_id: string;
  title: string;
  description?: string;
}

interface ModelQuizShape {
  question: string;
  options: string[];
  correct_index: number;
}

function isModelQuizShape(value: unknown): value is ModelQuizShape {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.question === "string" &&
    Array.isArray(v.options) &&
    v.options.length >= 2 &&
    v.options.every((option) => typeof option === "string") &&
    typeof v.correct_index === "number" &&
    v.correct_index >= 0 &&
    v.correct_index < v.options.length
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<GenerateQuizBody>;
    const { topic_id, title, description } = body;

    if (!topic_id || !title) {
      return NextResponse.json(
        { success: false, error: "topic_id and title are required" },
        { status: 400 }
      );
    }

    const content = await chatComplete({
      jsonMode: true,
      messages: [
        {
          role: "system",
          content:
            'You write a single Active Recall quiz question for a short-form study video. ' +
            'Reply with strict JSON only, no prose: {"question":string,"options":string[4],"correct_index":number}. ' +
            "Keep the question under 100 characters and each option short.",
        },
        {
          role: "user",
          content: `Video title: ${title}\nDescription: ${description ?? "(none)"}`,
        },
      ],
    });

    const parsed: unknown = JSON.parse(content);

    if (!isModelQuizShape(parsed)) {
      return NextResponse.json(
        { success: false, error: "Model returned an unusable quiz shape" },
        { status: 502 }
      );
    }

    const quiz: QuizCardData = {
      id: crypto.randomUUID(),
      topic_id,
      question: parsed.question,
      options: parsed.options,
      correct_index: parsed.correct_index,
    };

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Quiz generation failed" },
      { status: 500 }
    );
  }
}
