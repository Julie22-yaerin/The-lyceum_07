import type { UserProfile, VideoComment } from "./types";

const PROFILE_KEY = "lyceum-profile";
const LIKED_VIDEOS_KEY = "lyceum-liked-videos";
const COMMENTS_KEY = "lyceum-comments";

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode) — state just won't persist.
  }
}

// ── Profile (set/edited via onboarding) ──────────────────────────────
export function getStoredProfile(): Partial<UserProfile> | null {
  return readJSON<Partial<UserProfile>>(PROFILE_KEY);
}

export function saveStoredProfile(profile: UserProfile): void {
  writeJSON(PROFILE_KEY, profile);
}

// ── Reels likes ────────────────────────────────────────────────────────
export function getLikedVideoIds(): Set<string> {
  return new Set(readJSON<string[]>(LIKED_VIDEOS_KEY) ?? []);
}

export function setVideoLiked(videoId: string, liked: boolean): void {
  const ids = getLikedVideoIds();
  if (liked) ids.add(videoId);
  else ids.delete(videoId);
  writeJSON(LIKED_VIDEOS_KEY, Array.from(ids));
}

// ── Reels comments (seeded + user-added, per video) ────────────────────
export function getStoredComments(): Record<string, VideoComment[]> {
  return readJSON<Record<string, VideoComment[]>>(COMMENTS_KEY) ?? {};
}

export function addStoredComment(comment: VideoComment): void {
  const all = getStoredComments();
  const existing = all[comment.videoId] ?? [];
  all[comment.videoId] = [...existing, comment];
  writeJSON(COMMENTS_KEY, all);
}
