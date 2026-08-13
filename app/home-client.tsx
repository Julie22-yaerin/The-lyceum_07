"use client";

import { useState } from "react";
import FeedScroll from "@/components/feed/FeedScroll";
import StreakBar from "@/components/social/StreakBar";
import type { Friend, QuizCardData, VideoItem } from "@/lib/types";

interface HomeClientProps {
  videos: VideoItem[];
  quizzes: QuizCardData[];
  friends: Friend[];
}

export default function HomeClient({ videos, quizzes, friends: initialFriends }: HomeClientProps) {
  const [friends, setFriends] = useState(initialFriends);

  const topStreak = friends.reduce((max, friend) => Math.max(max, friend.streak_count), 0);

  const handleShare = (friendId: string) => {
    setFriends((prev) =>
      prev.map((friend) =>
        friend.id === friendId ? { ...friend, streak_count: friend.streak_count + 1 } : friend
      )
    );
  };

  return (
    <div className="relative h-screen w-full bg-bg">
      <StreakBar streakCount={topStreak} friends={friends} onShare={handleShare} />
      <FeedScroll videos={videos} quizzes={quizzes} />
    </div>
  );
}
