"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, ReelsIcon, SendIcon } from "@/components/icons";
import { mockChatThreads, mockFriends } from "@/lib/mock-data";
import { getSentMessages, markThreadRead } from "@/lib/storage";
import type { ChatMessage } from "@/lib/types";

export default function ChatThreadPage({ params }: { params: { friendId: string } }) {
  const friend = mockFriends.find((f) => f.id === params.friendId);
  const seedMessages = useMemo(() => mockChatThreads[params.friendId] ?? [], [params.friendId]);
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    void markThreadRead(params.friendId);
    getSentMessages().then((all) => {
      const sent = all[params.friendId] ?? [];
      if (sent.length > 0) setMessages([...seedMessages, ...sent]);
    });
    // seedMessages is derived fresh from params.friendId each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.friendId]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, fromMe: true, text, time: "Now" },
    ]);
    setDraft("");
  };

  return (
    <div className="flex h-screen w-full flex-col bg-bg">
      <header
        className="glass-nav sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-hairline px-3"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link href="/chat" className="flex h-9 w-9 items-center justify-center text-text">
          <ArrowLeftIcon width={22} height={22} />
        </Link>
        <span className="text-[16px] font-semibold tracking-[-0.01em] text-text">
          {friend?.name ?? "Friend"}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}
            >
              {message.sharedVideo ? (
                <a
                  href={message.sharedVideo.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex w-[220px] flex-col gap-2 rounded-card px-3.5 py-3 text-[13.5px] transition-opacity duration-150 active:opacity-80 ${
                    message.fromMe ? "bg-accent-strong text-white" : "bg-surface text-text"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                    <ReelsIcon width={14} height={14} />
                    Shared a video
                  </span>
                  <span className="truncate font-medium">
                    {message.sharedVideo.creatorHandle ?? message.sharedVideo.platform}
                  </span>
                  <span className="text-[12px] underline underline-offset-2 opacity-90">
                    Tap to watch
                  </span>
                </a>
              ) : (
                <div
                  className={`max-w-[75%] rounded-card px-3.5 py-2.5 text-[14.5px] leading-[1.4] ${
                    message.fromMe ? "bg-accent-strong text-white" : "bg-surface text-text"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex items-center gap-2 border-t border-hairline px-3 py-2.5"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleSend()}
          placeholder="Message"
          className="h-11 flex-1 rounded-pill border border-hairline bg-surface px-4 text-[14.5px] text-text placeholder:text-text-4 focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-strong text-white transition-transform duration-100 ease-out active:scale-[0.97] disabled:opacity-40"
        >
          <SendIcon width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
