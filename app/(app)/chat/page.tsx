"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRightIcon, FlameIcon } from "@/components/icons";
import { mockFriends, mockInitiallyUnread, mockLastMessage } from "@/lib/mock-data";
import { getReadThreadIds } from "@/lib/storage";
import type { ChatFilter } from "@/lib/types";

const FILTERS: { id: ChatFilter; label: string }[] = [
  { id: "primary", label: "Primary" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];

export default function ChatInboxPage() {
  const [filter, setFilter] = useState<ChatFilter>("primary");
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const read = getReadThreadIds();
    setUnreadIds(
      new Set(Array.from(mockInitiallyUnread).filter((id) => !read.has(id)))
    );
  }, []);

  const friends = mockFriends.filter((friend) => {
    if (filter === "unread") return unreadIds.has(friend.id);
    if (filter === "read") return !unreadIds.has(friend.id);
    return true;
  });

  return (
    <div className="h-screen w-full overflow-y-auto bg-bg pb-[100px] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-[560px] px-4">
        <h1 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-text">Chat</h1>

        {/* Segmented filter — grey track + one moving pill */}
        <div className="mb-4 inline-flex gap-0.5 rounded-pill bg-surface-3 p-0.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-pill px-4 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                filter === item.id
                  ? "bg-surface text-text shadow-panel"
                  : "text-text-2"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-panel bg-surface shadow-panel">
          {friends.length === 0 && (
            <p className="px-4 py-8 text-center text-[14px] text-text-3">
              {filter === "unread" ? "You're all caught up." : "No conversations here."}
            </p>
          )}
          {friends.map((friend, index) => {
            const isUnread = unreadIds.has(friend.id);
            return (
              <Link
                key={friend.id}
                href={`/chat/${friend.id}`}
                className={`flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors duration-150 active:bg-surface-2 ${
                  index > 0 ? "border-t border-hairline" : ""
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[15px] font-semibold text-text">
                  {friend.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`text-[15px] text-text ${isUnread ? "font-semibold" : "font-medium"}`}
                    >
                      {friend.name}
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] tabular-nums text-text-3">
                      <FlameIcon width={12} height={12} className="text-accent" />
                      {friend.streak_count}
                    </span>
                  </span>
                  <span
                    className={`block truncate text-[13px] ${isUnread ? "font-medium text-text" : "text-text-2"}`}
                  >
                    {mockLastMessage[friend.id]}
                  </span>
                </span>
                {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                <ChevronRightIcon width={18} height={18} className="shrink-0 text-text-4" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
