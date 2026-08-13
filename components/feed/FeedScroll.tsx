"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QuizCard from "@/components/feed/QuizCard";
import VideoSlide from "@/components/feed/VideoSlide";
import { buildInterleavedFeed } from "@/lib/interleave";
import type { QuizCardData, VideoItem } from "@/lib/types";

interface FeedScrollProps {
  videos: VideoItem[];
  quizzes: QuizCardData[];
}

// Only the active slide plus its immediate neighbors get a real player
// mounted; everything else renders a lightweight thumbnail placeholder.
const RENDER_WINDOW = 1;

export default function FeedScroll({ videos, quizzes }: FeedScrollProps) {
  const slides = useMemo(() => buildInterleavedFeed(videos, quizzes), [videos, quizzes]);

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
            {slide.kind === "video" ? (
              <VideoSlide
                video={slide.data}
                isActive={index === activeIndex}
                shouldRender={shouldRender}
              />
            ) : shouldRender ? (
              <QuizCard quiz={slide.data} />
            ) : (
              <div className="h-full w-full bg-bg" />
            )}
          </div>
        );
      })}
    </div>
  );
}
