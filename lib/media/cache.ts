import { createHash } from "node:crypto";
import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import type { PlayerType } from "@/lib/types";

// Server-only Firestore client for caching resolved media. Kept separate
// from lib/firebase/client.ts, whose `db` export is deliberately null
// outside the browser (that one gets imported into page components, which
// Next.js prerenders on the server during `next build` — see the comment
// there). API routes are never prerendered as pages, so it's safe to
// initialize eagerly here; a distinct named app avoids any collision if
// this module were ever imported alongside the client one in-process.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function cacheDb() {
  const existing = getApps().find((a) => a.name === "media-cache");
  const app = existing ?? initializeApp(firebaseConfig, "media-cache");
  return getFirestore(app);
}

function keyFor(originalUrl: string): string {
  return createHash("sha256").update(originalUrl).digest("hex").slice(0, 40);
}

export interface CachedMedia {
  player_type: PlayerType;
  embed_url?: string;
  stream_url?: string;
  thumbnail?: string;
  duration?: number;
  creator?: string;
  iframe_html?: string | null;
}

// Direct-file URLs (Iframely/Microlink CDN links) are typically signed and
// expire — refresh those periodically. iframe embeds and oEmbed widgets are
// stable, ID-based URLs that don't expire, so they're cached far longer.
const DIRECT_MP4_TTL_MS = 12 * 60 * 60 * 1000;
const STABLE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Read-through cache for a resolved video, keyed by its original URL and
 * shared across every user — once any one person's feed resolves a given
 * TikTok/Instagram/YouTube link, everyone else gets it instantly instead of
 * repeating the Iframely/Microlink/AI waterfall. Never throws — a cache
 * failure just means the caller falls through to a live resolve.
 */
export async function getCachedMedia(originalUrl: string): Promise<CachedMedia | null> {
  try {
    const snap = await getDoc(doc(cacheDb(), "resolvedMedia", keyFor(originalUrl)));
    if (!snap.exists()) return null;
    const data = snap.data() as CachedMedia & { cachedAt?: Timestamp };
    const ttl = data.player_type === "direct_mp4" ? DIRECT_MP4_TTL_MS : STABLE_TTL_MS;
    if (Date.now() - (data.cachedAt?.toMillis() ?? 0) > ttl) return null;
    return data;
  } catch {
    return null;
  }
}

export async function setCachedMedia(originalUrl: string, media: CachedMedia): Promise<void> {
  try {
    await setDoc(doc(cacheDb(), "resolvedMedia", keyFor(originalUrl)), {
      ...media,
      cachedAt: serverTimestamp(),
    });
  } catch {
    // Best-effort — a failed write shouldn't fail a request that already
    // has a good result to return to the caller.
  }
}

/**
 * Caches the AI-picked YouTube search query per topic (not per video), so
 * the OpenRouter call in the YouTube-Short fallback only ever runs once for
 * a given topic globally, even across many different broken source URLs
 * that share it.
 */
export async function getCachedTopicQuery(topic: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(cacheDb(), "topicQueries", topic));
    return snap.exists() ? ((snap.data().query as string) ?? null) : null;
  } catch {
    return null;
  }
}

export async function setCachedTopicQuery(topic: string, query: string): Promise<void> {
  try {
    await setDoc(doc(cacheDb(), "topicQueries", topic), { query, cachedAt: serverTimestamp() });
  } catch {
    // Best-effort, same as setCachedMedia above.
  }
}
