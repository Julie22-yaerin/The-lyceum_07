"use client";

import { FlameIcon } from "@/components/icons";
import type { Friend } from "@/lib/types";

interface ShareDrawerProps {
  isOpen: boolean;
  friends: Friend[];
  onClose: () => void;
  onShare: (friendId: string) => void;
}

export default function ShareDrawer({ isOpen, friends, onClose, onShare }: ShareDrawerProps) {
  return (
    <div aria-hidden={!isOpen} className={isOpen ? "" : "pointer-events-none"}>
      <div
        onClick={onClose}
        className={`app-scrim fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-out-quart ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`app-sheet ${isOpen ? "is-open" : "is-closed"} fixed inset-x-0 bottom-0 z-50 rounded-t-[var(--r-panel)] border-t border-hairline bg-surface px-5 pt-2.5 shadow-overlay transition-[transform,opacity] duration-[320ms] ease-spring ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-4 h-[5px] w-[38px] rounded-pill bg-faint" />
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-text-3">
          Share to friend
        </h2>

        <div className="flex flex-col">
          {friends.length === 0 && (
            <p className="py-6 text-center text-[14px] text-text-3">No friends yet</p>
          )}
          {friends.map((friend, index) => (
            <button
              key={friend.id}
              type="button"
              onClick={() => onShare(friend.id)}
              className={`flex min-h-11 items-center justify-between gap-3 py-3 text-left transition-colors duration-150 active:bg-surface-2 ${
                index > 0 ? "border-t border-hairline" : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-[14px] font-semibold text-text">
                  {friend.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-[15px] font-medium text-text">{friend.name}</span>
              </span>
              <span className="flex items-center gap-1 text-[12px] tabular-nums text-text-3">
                <FlameIcon width={14} height={14} className="text-accent" />
                {friend.streak_count}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-11 w-full rounded-sheet border border-hairline text-[15px] font-medium text-text-2 transition-colors duration-150 active:bg-surface-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
