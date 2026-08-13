"use client";

import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Next.js hot-reloads client modules — guard against re-initializing.
export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

// getAuth/getFirestore validate the config eagerly and throw if the API key
// is missing — and Next.js prerenders every page (even "use client" ones,
// since AuthProvider wraps the root layout) on the server during `next
// build`. A deploy platform with no NEXT_PUBLIC_FIREBASE_* env vars set
// would crash the entire build. Nothing in this app touches auth/db outside
// a useEffect or event handler (never during the render pass itself), so
// it's safe to skip real initialization on the server — these values are
// never dereferenced there.
export const auth: Auth =
  typeof window !== "undefined" ? getAuth(firebaseApp) : (null as unknown as Auth);
export const db: Firestore =
  typeof window !== "undefined" ? getFirestore(firebaseApp) : (null as unknown as Firestore);
export const googleProvider: GoogleAuthProvider =
  typeof window !== "undefined"
    ? new GoogleAuthProvider()
    : (null as unknown as GoogleAuthProvider);

// Analytics needs a real browser (window, IndexedDB) — never on the server,
// and not every browser context supports it (e.g. some in-app webviews).
let analyticsPromise: Promise<Analytics | null> | null = null;
export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) =>
      supported ? getAnalytics(firebaseApp) : null
    );
  }
  return analyticsPromise;
}
