"use client";

import { useEffect, useState } from "react";
import UniversalPlayer from "@/components/player/UniversalPlayer";
import type { PlayerType, ResolveResponse, VideoItem } from "@/lib/types";

interface VideoSlideProps {
  video: VideoItem;
  isActive: boolean;
  shouldRender: boolean;
}

interface ResolvedMedia {
  playerType: PlayerType;
  embedUrl?: string | null;
  streamUrl?: string | null;
  iframeHtml?: string | null;
}

export default function VideoSlide({ video, isActive, shouldRender }: VideoSlideProps) {
  // Supabase cache hit: direct_mp4_url already stored, skip the resolve round-trip.
  const cached: ResolvedMedia | null = video.direct_mp4_url
    ? { playerType: "direct_mp4", streamUrl: video.direct_mp4_url }
    : null;

  const [resolved, setResolved] = useState<ResolvedMedia | null>(cached);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (resolved || !shouldRender) return;

    let cancelled = false;

    async function resolveMedia() {
      try {
        const res = await fetch("/api/v1/media/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original_url: video.original_url,
            platform: video.platform,
          }),
        });
        const data: ResolveResponse = await res.json();
        if (cancelled) return;

        if (!data.success) {
          setError(true);
          return;
        }

        if (data.player_type === "iframe") {
          setResolved({ playerType: "iframe", embedUrl: data.embed_url });
        } else if (data.player_type === "direct_mp4") {
          setResolved({ playerType: "direct_mp4", streamUrl: data.stream_url });
        } else {
          setResolved({ playerType: "iframe_fallback", iframeHtml: data.iframe_html });
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    resolveMedia();
    return () => {
      cancelled = true;
    };
  }, [resolved, shouldRender, video.original_url, video.platform]);

  if (!shouldRender) {
    return (
      <div className="h-full w-full bg-video">
        {video.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail_url}
            alt=""
            aria-hidden
            className="h-full w-full object-cover opacity-60"
          />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-video text-[14px] text-text-3">
        Video unavailable
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="relative h-full w-full bg-video">
        {video.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail_url}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-4 border-t-accent" />
        </div>
      </div>
    );
  }

  return (
    <UniversalPlayer
      playerType={resolved.playerType}
      embedUrl={resolved.embedUrl}
      streamUrl={resolved.streamUrl}
      iframeHtml={resolved.iframeHtml}
      thumbnail={video.thumbnail_url}
      isActive={isActive}
    />
  );
}
