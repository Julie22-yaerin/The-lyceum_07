"use client";

import { useState } from "react";
import ShareDrawer from "@/components/social/ShareDrawer";
import type { Friend } from "@/lib/types";

interface StreakBarProps {
  streakCount: number;
  friends: Friend[];
  onShare: (friendId: string) => void;
}

export default function StreakBar({ streakCount, friends, onShare }: StreakBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md">
          <span aria-hidden>🔥</span>
          <span>{streakCount}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/60"
        >
          <span aria-hidden>📤</span>
          Share
        </button>
      </div>

      <ShareDrawer
        isOpen={isDrawerOpen}
        friends={friends}
        onClose={() => setIsDrawerOpen(false)}
        onShare={(friendId) => {
          onShare(friendId);
          setIsDrawerOpen(false);
        }}
      />
    </>
  );
}
