"use client";

import { useEffect, useState } from "react";
import VideoActions from "@/components/feed/VideoActions";
import type { MemeResult } from "@/lib/ai/meme";

interface MemeSlideProps {
  topic: string;
  slideId: string;
  shouldRender: boolean;
}

export default function MemeSlide({ topic, slideId, shouldRender }: MemeSlideProps) {
  const [meme, setMeme] = useState<MemeResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (meme || !shouldRender) return;

    let cancelled = false;

    async function fetchMeme() {
      try {
        const res = await fetch("/api/v1/ai/meme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!data.success) {
          setError(true);
          return;
        }
        setMeme(data.meme as MemeResult);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchMeme();
    return () => {
      cancelled = true;
    };
  }, [meme, shouldRender, topic]);

  if (!shouldRender) {
    return <div className="h-full w-full bg-video" />;
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-video px-6 text-center text-[14px] text-text-3">
        Couldn&apos;t fetch a meme for this topic right now.
      </div>
    );
  }

  if (!meme) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-video">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-4 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-video">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={meme.imageUrl} alt={meme.title} className="h-full w-full object-contain" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 pb-28 pt-16">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          AI-picked for this topic
        </span>
        <p className="mt-1 text-[14px] font-medium leading-[1.4] text-white">{meme.title}</p>
        <p className="mt-0.5 text-[12px] text-white/60">r/{meme.subreddit}</p>
      </div>
      <VideoActions videoId={slideId} />
    </div>
  );
}
