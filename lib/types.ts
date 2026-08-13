export type Platform = "youtube" | "tiktok" | "instagram" | "twitter";

export type PlayerType = "iframe" | "direct_mp4" | "iframe_fallback";

export interface ResolveRequestBody {
  original_url: string;
  platform: Platform;
}

export interface ResolveSuccessIframe {
  success: true;
  player_type: "iframe";
  embed_url: string;
}

export interface ResolveSuccessDirectMp4 {
  success: true;
  player_type: "direct_mp4";
  stream_url: string;
  thumbnail: string;
  duration: number;
  creator: string;
}

export interface ResolveSuccessFallback {
  success: true;
  player_type: "iframe_fallback";
  iframe_html: string | null;
  original_url: string;
}

export interface ResolveError {
  success: false;
  error: string;
}

export type ResolveResponse =
  | ResolveSuccessIframe
  | ResolveSuccessDirectMp4
  | ResolveSuccessFallback
  | ResolveError;

export type ContentType = "educational" | "entertainment";

export interface VideoItem {
  id: string;
  topic_id: string;
  content_type: ContentType;
  platform: Platform;
  original_url: string;
  direct_mp4_url?: string | null;
  thumbnail_url?: string | null;
  creator_handle?: string | null;
  duration_seconds?: number | null;
}

export interface QuizCardData {
  id: string;
  topic_id: string;
  question: string;
  options: string[];
  correct_index: number;
}

export type FeedSlide =
  | { kind: "video"; id: string; data: VideoItem }
  | { kind: "quiz"; id: string; data: QuizCardData };

export interface Friend {
  id: string;
  name: string;
  avatar_url?: string | null;
  streak_count: number;
}

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
}

export const AVATAR_COLORS = [
  "#5ac8fa",
  "#0a84ff",
  "#30d158",
  "#ff9f0a",
  "#ff453a",
  "#bf5af2",
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

export interface UserProfile {
  name: string;
  handle: string;
  bio: string;
  avatarColor: AvatarColor;
  avatarPhoto?: string | null;
  referralCode: string;
}

export interface Achievement {
  id: string;
  title: string;
  caption: string;
  earned: boolean;
}

export interface VideoComment {
  id: string;
  videoId: string;
  authorName: string;
  text: string;
  mentions: string[];
  createdAt: string;
}

export type ChatFilter = "primary" | "unread" | "read";
