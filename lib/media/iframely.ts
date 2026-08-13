interface IframelyLink {
  href: string;
  type?: string;
  rel?: string[];
}

interface IframelyResponse {
  meta?: {
    title?: string;
    author?: string;
    site?: string;
    duration?: number;
  };
  links?: {
    thumbnail?: IframelyLink[];
    player?: IframelyLink[];
    video?: IframelyLink[];
  };
  error?: number;
}

export interface IframelyResolved {
  playerType: "direct_mp4" | "iframe";
  streamUrl?: string;
  embedUrl?: string;
  thumbnail: string;
  duration: number;
  creator: string;
}

/**
 * Resolves a video URL via the Iframely API. Returns null (never throws)
 * on missing config, network failure, or no usable video/player link —
 * callers are expected to fall back to another provider.
 */
export async function resolveWithIframely(targetUrl: string): Promise<IframelyResolved | null> {
  const apiKey = process.env.IFRAMELY_API_KEY;
  if (!apiKey) return null;

  const iframelyUrl = `https://iframe.ly/api/iframely?url=${encodeURIComponent(targetUrl)}&key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(iframelyUrl, {
      headers: { "User-Agent": "AlgoScroll/6.0" },
      next: { revalidate: 43200 }, // Cache 12 hours
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const data = (await response.json()) as IframelyResponse;
  if (data.error) return null;

  const thumbnail = data.links?.thumbnail?.[0]?.href ?? "";
  const duration = data.meta?.duration ?? 0;
  const creator = data.meta?.author || data.meta?.site || "@creator";

  const videoLink = data.links?.video?.[0]?.href;
  if (videoLink) {
    return { playerType: "direct_mp4", streamUrl: videoLink, thumbnail, duration, creator };
  }

  // Most platforms (TikTok/IG/X) only grant an official embeddable player,
  // not a raw file — that's still a real playable result.
  const playerLink = data.links?.player?.[0]?.href;
  if (playerLink) {
    return { playerType: "iframe", embedUrl: playerLink, thumbnail, duration, creator };
  }

  return null;
}
