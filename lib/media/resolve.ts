import { getCachedMedia, setCachedMedia, type CachedMedia } from "@/lib/media/cache";
import { resolveWithIframely } from "@/lib/media/iframely";
import { resolveTopicYouTubeShort } from "@/lib/media/youtube-fallback";
import type { Platform, ResolveResponse } from "@/lib/types";

const ALLOWED_PLATFORMS: readonly Platform[] = ["youtube", "tiktok", "instagram", "twitter"];

export function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isAllowedPlatform(value: unknown): value is Platform {
  return typeof value === "string" && (ALLOWED_PLATFORMS as readonly string[]).includes(value);
}

function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:shorts\/|v=|youtu\.be\/)([^"&?/\s]{11})/);
  return match ? match[1] : null;
}

function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=0&mute=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0`;
}

function toResponse(media: CachedMedia, originalUrl: string): ResolveResponse {
  if (media.player_type === "direct_mp4" && media.stream_url) {
    return {
      success: true,
      player_type: "direct_mp4",
      stream_url: media.stream_url,
      thumbnail: media.thumbnail ?? "",
      duration: media.duration ?? 0,
      creator: media.creator ?? "@creator",
    };
  }
  if (media.player_type === "iframe" && media.embed_url) {
    return { success: true, player_type: "iframe", embed_url: media.embed_url };
  }
  return {
    success: true,
    player_type: "iframe_fallback",
    iframe_html: media.iframe_html ?? null,
    original_url: originalUrl,
  };
}

interface MicrolinkResult {
  status?: string;
  data?: {
    video?: { url?: string; duration?: number };
    image?: { url?: string };
    author?: string;
    publisher?: string;
    iframe?: { html?: string };
  };
}

async function fetchMicrolink(originalUrl: string): Promise<MicrolinkResult | null> {
  try {
    const response = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(originalUrl)}&video=true`,
      { headers: { "User-Agent": "AlgoScroll/6.0" }, next: { revalidate: 43200 } }
    );
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Resolves a single video URL to a playable result — the shared core used
 * by both the single-video and batch resolve API routes.
 *
 * Speed: a Firestore-backed cache (lib/media/cache.ts), shared across every
 * user, is checked first — once any one person resolves a given URL,
 * everyone else gets it back in one fast Firestore read instead of
 * repeating the Iframely/Microlink/AI waterfall. On a cache miss, Iframely
 * and Microlink are queried concurrently (previously sequential) so a cold
 * resolve only pays for the slower of the two, not both in series.
 */
export async function resolveOriginalUrl(
  originalUrl: string,
  platform: Platform,
  topic?: string
): Promise<ResolveResponse> {
  // 1. YouTube Shorts — direct native embed, no external lookup needed.
  if (platform === "youtube") {
    const videoId = extractYouTubeVideoId(originalUrl);
    if (videoId) {
      return { success: true, player_type: "iframe", embed_url: youtubeEmbedUrl(videoId) };
    }
  }

  // 2. Shared cache — skip the whole waterfall on a hit.
  const cached = await getCachedMedia(originalUrl);
  if (cached) return toResponse(cached, originalUrl);

  // 3. TikTok / Instagram / X — Iframely and Microlink concurrently.
  const [iframelyResult, microlinkResult] = await Promise.all([
    resolveWithIframely(originalUrl),
    fetchMicrolink(originalUrl),
  ]);

  if (iframelyResult?.playerType === "direct_mp4" && iframelyResult.streamUrl) {
    const media: CachedMedia = {
      player_type: "direct_mp4",
      stream_url: iframelyResult.streamUrl,
      thumbnail: iframelyResult.thumbnail,
      duration: iframelyResult.duration,
      creator: iframelyResult.creator,
    };
    void setCachedMedia(originalUrl, media);
    return toResponse(media, originalUrl);
  }
  if (iframelyResult?.playerType === "iframe" && iframelyResult.embedUrl) {
    const media: CachedMedia = { player_type: "iframe", embed_url: iframelyResult.embedUrl };
    void setCachedMedia(originalUrl, media);
    return toResponse(media, originalUrl);
  }
  if (microlinkResult?.status === "success" && microlinkResult.data?.video?.url) {
    const media: CachedMedia = {
      player_type: "direct_mp4",
      stream_url: microlinkResult.data.video.url,
      thumbnail: microlinkResult.data.image?.url ?? "",
      duration: microlinkResult.data.video.duration ?? 0,
      creator: microlinkResult.data.author || microlinkResult.data.publisher || "@creator",
    };
    void setCachedMedia(originalUrl, media);
    return toResponse(media, originalUrl);
  }

  // 4. Neither provider gave a real playable video for tiktok/instagram —
  // swap in an AI-picked same-topic YouTube Short instead of the platform's
  // own (often unreliable/embed-restricted) oEmbed widget.
  if ((platform === "tiktok" || platform === "instagram") && topic) {
    const embedUrl = await resolveTopicYouTubeShort(topic);
    if (embedUrl) {
      const media: CachedMedia = { player_type: "iframe", embed_url: embedUrl };
      void setCachedMedia(originalUrl, media);
      return toResponse(media, originalUrl);
    }
  }

  // 5. Last resort — whichever oEmbed widget html is available. Not cached:
  // this is the least reliable tier, and it's cheap to just re-try next time.
  return {
    success: true,
    player_type: "iframe_fallback",
    iframe_html: iframelyResult?.embedHtml ?? microlinkResult?.data?.iframe?.html ?? null,
    original_url: originalUrl,
  };
}
