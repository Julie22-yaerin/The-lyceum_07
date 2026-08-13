"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MemeSlide from "@/components/feed/MemeSlide";
import QuizCard from "@/components/feed/QuizCard";
import VideoSlide from "@/components/feed/VideoSlide";
import { buildInterleavedFeed } from "@/lib/interleave";
import type { FeedSlideContext, QuizCardData, VideoItem } from "@/lib/types";

interface FeedScrollProps {
  videos: VideoItem[];
  quizzes: QuizCardData[];
  onActiveSlideChange?: (context: FeedSlideContext | null) => void;
}

// Only the active slide plus its immediate neighbors get a real player
// mounted; everything else renders a lightweight thumbnail placeholder.
const RENDER_WINDOW = 1;

export default function FeedScroll({ videos, quizzes, onActiveSlideChange }: FeedScrollProps) {
  const slides = useMemo(() => {
    const base = buildInterleavedFeed(videos, quizzes);
    const topic = videos[0]?.topic_id ?? "study";
    // One AI-curated meme slide per feed, demonstrating the feature —
    // a full ratio-based rollout is a follow-up, not a rework of the
    // already-tested quiz interleave logic.
    const withMeme = [...base];
    withMeme.splice(2, 0, { kind: "meme", id: `meme-${topic}`, data: { topic } });
    return withMeme;
  }, [videos, quizzes]);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!Number.isNaN(index)) setActiveIndex(index);
          }
        });
      },
      { root: container, threshold: [0.6] }
    );

    slideRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [slides]);

  useEffect(() => {
    if (!onActiveSlideChange) return;
    const slide = slides[activeIndex];
    if (!slide) {
      onActiveSlideChange(null);
      return;
    }
    if (slide.kind === "video") {
      onActiveSlideChange({
        kind: "video",
        topic: slide.data.topic_id,
        detail: `A ${slide.data.content_type} video on ${slide.data.platform}${
          slide.data.creator_handle ? ` by ${slide.data.creator_handle}` : ""
        }, topic: ${slide.data.topic_id}.`,
      });
    } else if (slide.kind === "quiz") {
      onActiveSlideChange({
        kind: "quiz",
        topic: slide.data.topic_id,
        detail: `An Active Recall quiz question: "${slide.data.question}" with options ${slide.data.options.join(", ")}.`,
      });
    } else {
      onActiveSlideChange({
        kind: "meme",
        topic: slide.data.topic,
        detail: `A meme related to ${slide.data.topic}.`,
      });
    }
  }, [activeIndex, slides, onActiveSlideChange]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
      style={{ touchAction: "pan-y" }}
    >
      {slides.map((slide, index) => {
        const shouldRender = Math.abs(index - activeIndex) <= RENDER_WINDOW;

        return (
          <div
            key={slide.id}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            data-index={index}
            className="relative h-screen w-full snap-start snap-always"
          >
            {slide.kind === "video" && (
              <VideoSlide
                video={slide.data}
                isActive={index === activeIndex}
                shouldRender={shouldRender}
              />
            )}
            {slide.kind === "meme" && (
              <MemeSlide topic={slide.data.topic} slideId={slide.id} shouldRender={shouldRender} />
            )}
            {slide.kind === "quiz" &&
              (shouldRender ? (
                <QuizCard quiz={slide.data} />
              ) : (
                <div className="h-full w-full bg-video" />
              ))}
          </div>
        );
      })}
    </div>
  );
}
