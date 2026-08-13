import type { Friend, QuizCardData, VideoItem } from "./types";

export const mockVideos: VideoItem[] = [
  {
    id: "v1",
    topic_id: "igcse-calculus",
    content_type: "educational",
    platform: "youtube",
    original_url: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    thumbnail_url: null,
    creator_handle: "@math_genius",
    duration_seconds: 34,
  },
  {
    id: "v2",
    topic_id: "igcse-calculus",
    content_type: "educational",
    platform: "youtube",
    original_url: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    thumbnail_url: null,
    creator_handle: "@physics_daily",
    duration_seconds: 28,
  },
  {
    id: "v3",
    topic_id: "igcse-calculus",
    content_type: "educational",
    platform: "youtube",
    original_url: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    thumbnail_url: null,
    creator_handle: "@chem_hacks",
    duration_seconds: 41,
  },
  {
    id: "v4",
    topic_id: "meme-break",
    content_type: "entertainment",
    platform: "tiktok",
    original_url: "https://www.tiktok.com/@example/video/1234567890",
    thumbnail_url: null,
    creator_handle: "@funny_clips",
    duration_seconds: 15,
  },
];

export const mockFriends: Friend[] = [
  { id: "f1", name: "Minh", streak_count: 12 },
  { id: "f2", name: "Lan", streak_count: 5 },
  { id: "f3", name: "Khoa", streak_count: 21 },
];

export const mockQuizzes: QuizCardData[] = [
  {
    id: "q1",
    topic_id: "igcse-calculus",
    question: "What is the derivative of x^2?",
    options: ["x", "2x", "x^2", "2"],
    correct_index: 1,
  },
  {
    id: "q2",
    topic_id: "igcse-calculus",
    question: "What is the integral of 2x dx?",
    options: ["x^2 + C", "2x^2 + C", "x + C", "2 + C"],
    correct_index: 0,
  },
];
