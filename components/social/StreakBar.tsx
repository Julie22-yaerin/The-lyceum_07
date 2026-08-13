"use client";

import { useState } from "react";
import ShareDrawer from "@/components/social/ShareDrawer";
import { FlameIcon, ShareIcon } from "@/components/icons";
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
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="glass-nav pointer-events-auto flex h-11 items-center gap-1.5 rounded-pill border border-hairline px-4">
          <FlameIcon width={18} height={18} className="text-accent" />
          <span className="tabular-nums text-[15px] font-semibold text-text">{streakCount}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="glass-nav pointer-events-auto flex h-11 items-center gap-1.5 rounded-pill border border-hairline px-4 text-text-2 transition-transform duration-100 ease-out active:scale-[0.97]"
        >
          <ShareIcon width={18} height={18} />
          <span className="text-[14px] font-medium">Share</span>
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
