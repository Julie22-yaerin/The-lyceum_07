"use client";

import { useCallback, useState } from "react";
import AssistantBubble from "@/components/feed/AssistantBubble";
import FeedScroll from "@/components/feed/FeedScroll";
import StreakBar from "@/components/social/StreakBar";
import type { FeedSlideContext, Friend, QuizCardData, VideoItem } from "@/lib/types";

interface HomeClientProps {
  videos: VideoItem[];
  quizzes: QuizCardData[];
  friends: Friend[];
}

export default function HomeClient({ videos, quizzes, friends: initialFriends }: HomeClientProps) {
  const [friends, setFriends] = useState(initialFriends);
  const [activeSlideContext, setActiveSlideContext] = useState<FeedSlideContext | null>(null);

  const topStreak = friends.reduce((max, friend) => Math.max(max, friend.streak_count), 0);

  const handleShare = (friendId: string) => {
    setFriends((prev) =>
      prev.map((friend) =>
        friend.id === friendId ? { ...friend, streak_count: friend.streak_count + 1 } : friend
      )
    );
  };

  const handleActiveSlideChange = useCallback((context: FeedSlideContext | null) => {
    setActiveSlideContext(context);
  }, []);

  return (
    // Reels stays dark regardless of the app-wide theme toggle — same as
    // IG/TikTok, whose video-viewing screen never follows system light mode.
    <div className="relative h-screen w-full bg-video" data-theme="dark">
      <StreakBar streakCount={topStreak} friends={friends} onShare={handleShare} />
      <FeedScroll videos={videos} quizzes={quizzes} onActiveSlideChange={handleActiveSlideChange} />
      <AssistantBubble context={activeSlideContext} />
    </div>
  );
}
