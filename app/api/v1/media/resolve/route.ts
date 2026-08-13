import { NextResponse } from "next/server";
import { resolveWithIframely } from "@/lib/media/iframely";
import { resolveTopicYouTubeShort } from "@/lib/media/youtube-fallback";
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
    const { original_url, platform, topic } = body;

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

    // 2. TikTok / Instagram / X Strategy — Iframely first, Microlink as fallback
    const iframelyResult = await resolveWithIframely(original_url);
    if (iframelyResult?.playerType === "direct_mp4" && iframelyResult.streamUrl) {
      return NextResponse.json({
        success: true,
        player_type: "direct_mp4",
        stream_url: iframelyResult.streamUrl,
        thumbnail: iframelyResult.thumbnail,
        duration: iframelyResult.duration,
        creator: iframelyResult.creator,
      });
    }
    if (iframelyResult?.playerType === "iframe" && iframelyResult.embedUrl) {
      return NextResponse.json({
        success: true,
        player_type: "iframe",
        embed_url: iframelyResult.embedUrl,
      });
    }

    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(original_url)}&video=true`;
    let microlinkResult: { status?: string; data?: { video?: { url?: string; duration?: number }; image?: { url?: string }; author?: string; publisher?: string; iframe?: { html?: string } } } | null = null;
    try {
      const response = await fetch(microlinkUrl, {
        headers: { "User-Agent": "AlgoScroll/6.0" },
        next: { revalidate: 43200 }, // Cache 12 hours
      });
      microlinkResult = await response.json();
    } catch {
      microlinkResult = null;
    }

    if (microlinkResult?.status === "success" && microlinkResult.data?.video?.url) {
      return NextResponse.json({
        success: true,
        player_type: "direct_mp4",
        stream_url: microlinkResult.data.video.url,
        thumbnail: microlinkResult.data.image?.url ?? "",
        duration: microlinkResult.data.video.duration ?? 0,
        creator: microlinkResult.data.author || microlinkResult.data.publisher || "@creator",
      });
    }

    // 3. Neither provider gave a real playable video for tiktok/instagram —
    // swap in an AI-picked same-topic YouTube Short instead of the platform's
    // own (often unreliable/embed-restricted) oEmbed widget.
    if ((platform === "tiktok" || platform === "instagram") && topic) {
      const embedUrl = await resolveTopicYouTubeShort(topic);
      if (embedUrl) {
        return NextResponse.json({
          success: true,
          player_type: "iframe",
          embed_url: embedUrl,
        });
      }
    }

    // 4. Last resort — whichever oEmbed widget html is available.
    return NextResponse.json({
      success: true,
      player_type: "iframe_fallback",
      iframe_html: iframelyResult?.embedHtml ?? microlinkResult?.data?.iframe?.html ?? null,
      original_url,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Media Extraction Failed" },
      { status: 500 }
    );
  }
}
