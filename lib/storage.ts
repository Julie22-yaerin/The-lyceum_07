import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase/client";
import type { ChatMessage, UserProfile, VideoComment } from "./types";

function requireUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

// ── Profile (set/edited via onboarding) ──────────────────────────────
export async function getStoredProfile(): Promise<Partial<UserProfile> | null> {
  const uid = requireUid();
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as Partial<UserProfile>) : null;
}

export async function saveStoredProfile(profile: UserProfile): Promise<void> {
  const uid = requireUid();
  if (!uid) return;
  await setDoc(doc(db, "users", uid), profile, { merge: true });
}

// ── Chat read/unread state ────────────────────────────────────────────
export async function getReadThreadIds(): Promise<Set<string>> {
  const uid = requireUid();
  if (!uid) return new Set();
  const snap = await getDocs(collection(db, "users", uid, "readThreads"));
  return new Set(snap.docs.map((d) => d.id));
}

export async function markThreadRead(friendId: string): Promise<void> {
  const uid = requireUid();
  if (!uid) return;
  await setDoc(doc(db, "users", uid, "readThreads", friendId), { readAt: serverTimestamp() });
}

// ── Chat messages sent from the Share action (video shares, per friend) ──
export async function getSentMessages(): Promise<Record<string, ChatMessage[]>> {
  const uid = requireUid();
  if (!uid) return {};
  const snap = await getDocs(collection(db, "users", uid, "messageThreads"));
  const result: Record<string, ChatMessage[]> = {};
  for (const threadDoc of snap.docs) {
    result[threadDoc.id] = (threadDoc.data().items as ChatMessage[]) ?? [];
  }
  return result;
}

export async function sendMessageToFriend(friendId: string, message: ChatMessage): Promise<void> {
  const uid = requireUid();
  if (!uid) return;
  await setDoc(
    doc(db, "users", uid, "messageThreads", friendId),
    { items: arrayUnion(message) },
    { merge: true }
  );
}

// ── Reels likes ────────────────────────────────────────────────────────
export async function getLikedVideoIds(): Promise<Set<string>> {
  const uid = requireUid();
  if (!uid) return new Set();
  const snap = await getDocs(collection(db, "users", uid, "likedVideos"));
  return new Set(snap.docs.map((d) => d.id));
}

export async function setVideoLiked(videoId: string, liked: boolean): Promise<void> {
  const uid = requireUid();
  if (!uid) return;
  const ref = doc(db, "users", uid, "likedVideos", videoId);
  if (liked) {
    await setDoc(ref, { likedAt: serverTimestamp() });
  } else {
    await deleteDoc(ref);
  }
}

// ── Reels comments (shared across everyone, seeded + user-added, per video) ──
// Scoped to a single video's comments via a `where` query — a prior version
// fetched the entire (unbounded, cross-video) comments collection on every
// video mount, which got slower as more comments piled up.
export async function getStoredComments(videoId: string): Promise<VideoComment[]> {
  const snap = await getDocs(query(collection(db, "comments"), where("videoId", "==", videoId)));
  return snap.docs.map((commentDoc) => commentDoc.data() as VideoComment);
}

export async function addStoredComment(comment: VideoComment): Promise<void> {
  await setDoc(doc(db, "comments", comment.id), comment);
}
