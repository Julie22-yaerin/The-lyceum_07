"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerType } from "@/lib/types";

interface UniversalPlayerProps {
  playerType: PlayerType;
  embedUrl?: string | null;
  streamUrl?: string | null;
  iframeHtml?: string | null;
  thumbnail?: string | null;
  isActive: boolean;
  className?: string;
}

function postYouTubeCommand(iframe: HTMLIFrameElement | null, func: string) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func, args: [] }),
    "*"
  );
}

export default function UniversalPlayer({
  playerType,
  embedUrl,
  streamUrl,
  iframeHtml,
  thumbnail,
  isActive,
  className = "",
}: UniversalPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Sync <video> playback with slide visibility
  useEffect(() => {
    if (playerType !== "direct_mp4") return;
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {
        // Autoplay can be rejected before user gesture; ignore.
      });
    } else {
      video.pause();
    }
  }, [isActive, playerType]);

  // Sync YouTube iframe playback via postMessage JS API
  useEffect(() => {
    if (playerType !== "iframe") return;
    postYouTubeCommand(iframeRef.current, isActive ? "playVideo" : "pauseVideo");
  }, [isActive, playerType]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      if (playerType === "iframe") {
        postYouTubeCommand(iframeRef.current, next ? "mute" : "unMute");
      }
      return next;
    });
  };

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-bg ${className}`}
      style={{ touchAction: "pan-y" }}
      onClick={toggleMute}
    >
      {isLoading && thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-4 border-t-accent" />
        </div>
      )}

      {playerType === "direct_mp4" && streamUrl && (
        <video
          ref={videoRef}
          src={streamUrl}
          poster={thumbnail ?? undefined}
          className="h-full w-full object-cover"
          playsInline
          loop
          muted={isMuted}
          preload="metadata"
          onLoadedData={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
        />
      )}

      {playerType === "iframe" && embedUrl && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            setIsLoading(false);
            postYouTubeCommand(iframeRef.current, isActive ? "playVideo" : "pauseVideo");
          }}
        />
      )}

      {playerType === "iframe_fallback" && (
        iframeHtml ? (
          <div
            className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full"
            onLoad={() => setIsLoading(false)}
            ref={(node) => {
              if (node) setIsLoading(false);
            }}
            dangerouslySetInnerHTML={{ __html: iframeHtml }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[14px] text-text-3">
            Unable to load preview
          </div>
        )
      )}
    </div>
  );
}
