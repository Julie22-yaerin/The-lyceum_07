"use client";

import { useState } from "react";
import { mockFriends } from "@/lib/mock-data";
import type { VideoComment } from "@/lib/types";

interface CommentSheetProps {
  isOpen: boolean;
  comments: VideoComment[];
  onClose: () => void;
  onAdd: (text: string, mentions: string[]) => void;
}

function renderCommentText(text: string, mentions: string[]) {
  if (mentions.length === 0) return text;
  const escaped = mentions.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(@(?:${escaped.join("|")}))`, "g");
  return text.split(pattern).map((part, i) =>
    mentions.some((m) => part === `@${m}`) ? (
      <span key={i} className="font-semibold text-accent">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function CommentSheet({ isOpen, comments, onClose, onAdd }: CommentSheetProps) {
  const [draft, setDraft] = useState("");
  const [showMentions, setShowMentions] = useState(false);

  const handleChange = (value: string) => {
    setDraft(value);
    setShowMentions(value.endsWith("@"));
  };

  const insertMention = (name: string) => {
    setDraft((prev) => `${prev}${name} `);
    setShowMentions(false);
  };

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) return;
    const mentions = mockFriends.map((f) => f.name).filter((name) => text.includes(`@${name}`));
    onAdd(text, mentions);
    setDraft("");
    setShowMentions(false);
  };

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
        className={`app-sheet ${isOpen ? "is-open" : "is-closed"} fixed inset-x-0 bottom-0 z-50 flex h-[70vh] flex-col rounded-t-[var(--r-panel)] border-t border-hairline bg-surface shadow-overlay transition-[transform,opacity] duration-[320ms] ease-spring ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto mt-2.5 h-[5px] w-[38px] shrink-0 rounded-pill bg-faint" />
        <h2 className="px-5 py-3 text-[13px] font-semibold uppercase tracking-wide text-text-3">
          Comments
        </h2>

        <div className="flex-1 overflow-y-auto px-5">
          {comments.length === 0 && (
            <p className="py-8 text-center text-[14px] text-text-3">No comments yet.</p>
          )}
          <div className="flex flex-col gap-4 pb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[12px] font-semibold text-text">
                  {comment.authorName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-text">{comment.authorName}</p>
                  <p className="text-[14px] leading-[1.4] text-text-2">
                    {renderCommentText(comment.text, comment.mentions)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-4">{comment.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="relative shrink-0 border-t border-hairline px-4 py-3"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          {showMentions && (
            <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-card bg-surface-2 shadow-overlay">
              {mockFriends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => insertMention(friend.name)}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[14px] text-text active:bg-surface-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold">
                    {friend.name.charAt(0)}
                  </span>
                  {friend.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Add a comment… @ to tag a friend"
              className="h-11 flex-1 rounded-pill border border-hairline bg-bg px-4 text-[14px] text-text placeholder:text-text-4 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!draft.trim()}
              className="flex h-11 items-center rounded-pill bg-accent-strong px-4 text-[13.5px] font-semibold text-white transition-transform duration-100 ease-out active:scale-[0.97] disabled:opacity-40"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
