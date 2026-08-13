"use client";

import { useEffect, useState } from "react";
import CommentSheet from "@/components/feed/CommentSheet";
import ShareDrawer from "@/components/social/ShareDrawer";
import { ChatIcon, HeartIcon, ShareIcon } from "@/components/icons";
import { mockComments, mockFriends, mockLikeCounts, mockVideos } from "@/lib/mock-data";
import {
  addStoredComment,
  getLikedVideoIds,
  getStoredComments,
  sendMessageToFriend,
  setVideoLiked,
} from "@/lib/storage";
import type { ChatMessage, VideoComment } from "@/lib/types";

interface VideoActionsProps {
  videoId: string;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

export default function VideoActions({ videoId }: VideoActionsProps) {
  const baseLikes = mockLikeCounts[videoId] ?? 0;
  const seedComments = mockComments[videoId] ?? [];

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(baseLikes);
  const [comments, setComments] = useState<VideoComment[]>(seedComments);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareConfirmation, setShareConfirmation] = useState<string | null>(null);

  useEffect(() => {
    getLikedVideoIds().then((ids) => setLiked(ids.has(videoId)));
    getStoredComments().then((all) => {
      const stored = all[videoId] ?? [];
      if (stored.length) setComments([...seedComments, ...stored]);
    });
    // seedComments intentionally excluded — it's derived fresh from videoId each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((count) => count + (next ? 1 : -1));
    void setVideoLiked(videoId, next);
  };

  const handleAddComment = (text: string, mentions: string[]) => {
    const comment: VideoComment = {
      id: `local-${Date.now()}`,
      videoId,
      authorName: "You",
      text,
      mentions,
      createdAt: "Now",
    };
    setComments((prev) => [...prev, comment]);
    void addStoredComment(comment);
  };

  const handleShare = (friendId: string) => {
    const friend = mockFriends.find((f) => f.id === friendId);
    const video = mockVideos.find((v) => v.id === videoId);
    setIsShareOpen(false);
    if (!friend) return;

    if (video) {
      const message: ChatMessage = {
        id: `share-${Date.now()}`,
        fromMe: true,
        text: "Shared a video",
        time: "Now",
        sharedVideo: {
          videoId: video.id,
          platform: video.platform,
          originalUrl: video.original_url,
          creatorHandle: video.creator_handle,
        },
      };
      void sendMessageToFriend(friendId, message);
    }

    setShareConfirmation(`Sent to ${friend.name}`);
    setTimeout(() => setShareConfirmation(null), 2000);
  };

  return (
    <>
      <div
        className="absolute right-3 z-20 flex flex-col items-center gap-5"
        style={{ bottom: "max(96px, calc(env(safe-area-inset-bottom) + 84px))" }}
      >
        <button
          type="button"
          onClick={toggleLike}
          className="flex flex-col items-center gap-1 text-white"
        >
          <HeartIcon
            width={28}
            height={28}
            fill={liked ? "currentColor" : "none"}
            className={liked ? "text-danger" : "text-white"}
          />
          <span className="text-[11px] font-semibold tabular-nums [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            {formatCount(likeCount)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsCommentsOpen(true)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <ChatIcon width={26} height={26} />
          <span className="text-[11px] font-semibold tabular-nums [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            {formatCount(comments.length)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <ShareIcon width={25} height={25} />
          <span className="text-[11px] font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            Share
          </span>
        </button>
      </div>

      {shareConfirmation && (
        <div
          className="absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-pill bg-black/70 px-3.5 py-2 text-[13px] font-medium text-white"
          style={{ bottom: "max(150px, calc(env(safe-area-inset-bottom) + 138px))" }}
        >
          {shareConfirmation}
        </div>
      )}

      <CommentSheet
        isOpen={isCommentsOpen}
        comments={comments}
        onClose={() => setIsCommentsOpen(false)}
        onAdd={handleAddComment}
      />

      <ShareDrawer
        isOpen={isShareOpen}
        friends={mockFriends}
        onClose={() => setIsShareOpen(false)}
        onShare={handleShare}
      />
    </>
  );
}
