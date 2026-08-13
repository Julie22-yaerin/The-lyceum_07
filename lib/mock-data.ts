import type { Achievement, Friend, QuizCardData, UserProfile, VideoComment, VideoItem } from "./types";

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
    original_url: "https://www.youtube.com/shorts/jNQXAC9IVRw",
    thumbnail_url: null,
    creator_handle: "@physics_daily",
    duration_seconds: 28,
  },
  {
    id: "v3",
    topic_id: "igcse-calculus",
    content_type: "educational",
    platform: "youtube",
    original_url: "https://www.youtube.com/shorts/9bZkp7q19f0",
    thumbnail_url: null,
    creator_handle: "@chem_hacks",
    duration_seconds: 41,
  },
  {
    id: "v4",
    topic_id: "meme-break",
    content_type: "entertainment",
    platform: "tiktok",
    original_url: "https://www.tiktok.com/@scout2015/video/6718335390845095173",
    thumbnail_url: null,
    creator_handle: "@scout2015",
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
    question: "What is the derivative of $x^2$?",
    options: ["$x$", "$2x$", "$x^2$", "$2$"],
    correct_index: 1,
  },
  {
    id: "q2",
    topic_id: "igcse-calculus",
    question: "What is $\\int 2x \\, dx$?",
    options: ["$x^2 + C$", "$2x^2 + C$", "$x + C$", "$2 + C$"],
    correct_index: 0,
  },
  {
    id: "q3",
    topic_id: "igcse-calculus",
    question: "Solve for $x$: $x^2 - 5x + 6 = 0$",
    options: ["$x = 1, 6$", "$x = 2, 3$", "$x = -2, -3$", "$x = 0, 5$"],
    correct_index: 1,
  },
];

export const mockProfile: UserProfile = {
  name: "You",
  handle: "@you",
  bio: "Studying IGCSE the lazy way. 🔥21 streak and counting.",
  avatarColor: "#5ac8fa",
  avatarPhoto: null,
  referralCode: "LYCEUM-7F3K9",
};

export const mockAchievements: Achievement[] = [
  {
    id: "streak-7",
    title: "Week One",
    caption: "Hit a 7-day streak",
    earned: true,
  },
  {
    id: "streak-21",
    title: "Locked In",
    caption: "Hit a 21-day streak",
    earned: true,
  },
  {
    id: "first-quiz",
    title: "First Recall",
    caption: "Answered a quiz card",
    earned: true,
  },
  {
    id: "inviter",
    title: "Recruiter",
    caption: "Invited a friend",
    earned: false,
  },
  {
    id: "quiz-10",
    title: "Sharp Ten",
    caption: "Aced 10 quiz cards",
    earned: false,
  },
  {
    id: "night-owl",
    title: "Night Owl",
    caption: "Studied after midnight",
    earned: false,
  },
];

export const mockComments: Record<string, VideoComment[]> = {
  v1: [
    {
      id: "c1",
      videoId: "v1",
      authorName: "Minh",
      text: "wait this actually made it click for me",
      mentions: [],
      createdAt: "2h ago",
    },
    {
      id: "c2",
      videoId: "v1",
      authorName: "Lan",
      text: "@Khoa you need to see this before the quiz",
      mentions: ["Khoa"],
      createdAt: "1h ago",
    },
  ],
  v4: [
    {
      id: "c3",
      videoId: "v4",
      authorName: "Khoa",
      text: "not the reason I opened this app but ok",
      mentions: [],
      createdAt: "3h ago",
    },
  ],
};

export const mockLikeCounts: Record<string, number> = {
  v1: 128,
  v2: 64,
  v3: 47,
  v4: 512,
};
