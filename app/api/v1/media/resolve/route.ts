import { NextResponse } from "next/server";
import type { Platform, ResolveRequestBody, ResolveResponse } from "@/lib/types";

const ALLOWED_PLATFORMS: readonly Platform[] = [
  "youtube",
  "tiktok",
  "instagram",
  "twitter",
];

function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:shorts\/|v=|youtu\.be\/)([^"&?/\s]{11})/);
  return match ? match[1] : null;
}

export async function POST(req: Request): Promise<NextResponse<ResolveResponse>> {
  try {
    const body = (await req.json()) as Partial<ResolveRequestBody>;
    const { original_url, platform } = body;

    if (!isValidHttpUrl(original_url) || !platform || !ALLOWED_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { success: false, error: "Invalid original_url or platform" },
        { status: 400 }
      );
    }

    // 1. YouTube Shorts Strategy (Direct Native Embed)
    if (platform === "youtube") {
      const videoId = extractYouTubeVideoId(original_url);

      if (videoId) {
        return NextResponse.json({
          success: true,
          player_type: "iframe",
          embed_url: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=0&mute=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0`,
        });
      }
    }

    // 2. TikTok / Instagram / X Strategy (Microlink API)
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(original_url)}&video=true`;
    const response = await fetch(microlinkUrl, {
      headers: { "User-Agent": "AlgoScroll/6.0" },
      next: { revalidate: 43200 }, // Cache 12 hours
    });

    const result = await response.json();

    if (result.status === "success" && result.data?.video?.url) {
      return NextResponse.json({
        success: true,
        player_type: "direct_mp4",
        stream_url: result.data.video.url,
        thumbnail: result.data.image?.url ?? "",
        duration: result.data.video.duration ?? 0,
        creator: result.data.author || result.data.publisher || "@creator",
      });
    }

    // 3. Fallback Mode if direct stream extraction fails
    return NextResponse.json({
      success: true,
      player_type: "iframe_fallback",
      iframe_html: result.data?.iframe?.html ?? null,
      original_url,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Microlink Extraction Failed" },
      { status: 500 }
    );
  }
}
