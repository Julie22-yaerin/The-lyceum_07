"use client";

import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  signInWithEmailAndPassword,
  signInWithPopup,
  type AuthError,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/AuthProvider";
import { auth, googleProvider } from "@/lib/firebase/client";

function friendlyAuthError(error: unknown): string {
  const code = (error as AuthError | undefined)?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "That email already has an account — try signing in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/weak-password":
      return "Password needs to be at least 6 characters.";
    case "auth/invalid-email":
      return "That email doesn't look right.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before finishing.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/feed";
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The submit handlers below already know exactly where to send a fresh
  // sign-in (onboarding for new accounts, redirectTo for existing ones) —
  // this skips the generic "already logged in" effect so it doesn't race
  // them and bounce a brand-new signup straight to /feed before onboarding.
  const handledRedirectRef = useRef(false);

  useEffect(() => {
    if (!loading && user && !handledRedirectRef.current) router.replace(redirectTo);
  }, [loading, user, router, redirectTo]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        handledRedirectRef.current = true;
        router.replace(`/onboarding?next=${encodeURIComponent(redirectTo)}`);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        handledRedirectRef.current = true;
        router.replace(redirectTo);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
      handledRedirectRef.current = true;
      router.replace(
        isNewUser ? `/onboarding?next=${encodeURIComponent(redirectTo)}` : redirectTo
      );
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 text-center">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text">The Lyceum</h1>
          <p className="mt-1.5 text-[14px] text-text-2">
            {mode === "signin" ? "Welcome back." : "The unfair advantage for laziness."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-pill border border-hairline bg-surface text-[15px] font-medium text-text transition-transform duration-100 ease-out active:scale-[0.97] disabled:opacity-40"
        >
          <GoogleIcon width={18} height={18} />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-hairline" />
          <span className="text-[12px] text-text-4">or</span>
          <div className="h-px flex-1 bg-hairline" />
        </div>

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="h-12 w-full rounded-sheet border border-hairline bg-surface px-4 text-[15px] text-text placeholder:text-text-4 focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-12 w-full rounded-sheet border border-hairline bg-surface px-4 text-[15px] text-text placeholder:text-text-4 focus:outline-none focus:ring-1 focus:ring-accent"
          />

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-1.5 h-12 w-full rounded-pill bg-accent-strong text-[15px] font-semibold text-white transition-transform duration-100 ease-out active:scale-[0.97] disabled:opacity-40"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-text-3">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode((m) => (m === "signin" ? "signup" : "signin"));
            }}
            className="font-medium text-accent"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
