"use client";

import type { Friend } from "@/lib/types";

interface ShareDrawerProps {
  isOpen: boolean;
  friends: Friend[];
  onClose: () => void;
  onShare: (friendId: string) => void;
}

export default function ShareDrawer({ isOpen, friends, onClose, onShare }: ShareDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl bg-neutral-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white shadow-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        <h2 className="mb-3 text-sm font-semibold text-white/80">Share to friend</h2>
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {friends.length === 0 && (
            <li className="py-6 text-center text-sm text-white/50">No friends yet</li>
          )}
          {friends.map((friend) => (
            <li key={friend.id}>
              <button
                type="button"
                onClick={() => onShare(friend.id)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/10"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                    {friend.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">{friend.name}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-white/60">
                  <span aria-hidden>🔥</span>
                  {friend.streak_count}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
