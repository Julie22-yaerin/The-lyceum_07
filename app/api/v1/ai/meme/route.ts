import { NextResponse } from "next/server";
import { fetchTopicMeme } from "@/lib/ai/meme";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<{ topic: string }>;
    const topic = body.topic?.trim();

    if (!topic) {
      return NextResponse.json({ success: false, error: "topic is required" }, { status: 400 });
    }

    const meme = await fetchTopicMeme(topic);
    if (!meme) {
      return NextResponse.json({ success: false, error: "No meme found" }, { status: 502 });
    }

    return NextResponse.json({ success: true, meme });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Meme fetch failed" },
      { status: 500 }
    );
  }
}
