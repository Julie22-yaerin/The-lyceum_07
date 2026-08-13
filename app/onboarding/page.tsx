"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { CameraIcon, CheckIcon } from "@/components/icons";
import { mockProfile } from "@/lib/mock-data";
import { getStoredProfile, saveStoredProfile } from "@/lib/storage";
import { AVATAR_COLORS, type AvatarColor, type UserProfile } from "@/lib/types";

const STEPS = ["Nickname", "Username", "Photo", "Bio"] as const;

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/feed";

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarColor, setAvatarColor] = useState<AvatarColor>(AVATAR_COLORS[0]);
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only prefill when editing an existing profile — a first-time visitor
    // should see a blank form, not the demo account's mock name/bio.
    getStoredProfile().then((stored) => {
      if (!stored) return;
      setName(stored.name ?? "");
      setHandle((stored.handle ?? "").replace(/^@/, ""));
      setBio(stored.bio ?? "");
      setAvatarColor(stored.avatarColor ?? AVATAR_COLORS[0]);
      setAvatarPhoto(stored.avatarPhoto ?? null);
    });
  }, []);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPhoto(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const normalizedHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const canProceed = [
    name.trim().length > 0,
    normalizedHandle.length >= 3,
    true,
    true,
  ][step];

  const isLastStep = step === STEPS.length - 1;

  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    if (!canProceed) return;
    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }
    const profile: UserProfile = {
      name: name.trim(),
      handle: `@${normalizedHandle}`,
      bio: bio.trim(),
      avatarColor,
      avatarPhoto,
      referralCode: mockProfile.referralCode,
    };
    setSaving(true);
    await saveStoredProfile(profile);
    router.push(redirectTo);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      {/* Step progress */}
      <div className="flex w-full max-w-[360px] items-center gap-1.5">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`h-1 flex-1 rounded-pill transition-colors duration-300 ${
              index <= step ? "bg-accent-strong" : "bg-surface-3"
            }`}
          />
        ))}
      </div>

      <div className="flex w-full max-w-[360px] flex-1 flex-col justify-center gap-6 py-10">
        {step === 0 && (
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.02em] text-text">
              What should we call you?
            </h1>
            <p className="mt-1.5 text-[14px] text-text-2">
              Your nickname shows up on streaks and shared reels.
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nickname"
              maxLength={40}
              className="mt-5 h-12 w-full rounded-sheet border border-hairline bg-surface px-4 text-[16px] text-text placeholder:text-text-4 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.02em] text-text">
              Pick a username
            </h1>
            <p className="mt-1.5 text-[14px] text-text-2">
              Lowercase letters, numbers, underscores. At least 3 characters.
            </p>
            <div className="mt-5 flex h-12 w-full items-center rounded-sheet border border-hairline bg-surface px-4 focus-within:ring-1 focus-within:ring-accent">
              <span className="text-[16px] text-text-3">@</span>
              <input
                autoFocus
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="username"
                maxLength={24}
                className="ml-0.5 h-full flex-1 bg-transparent text-[16px] text-text placeholder:text-text-4 focus:outline-none"
              />
              {normalizedHandle.length >= 3 && (
                <CheckIcon width={18} height={18} className="text-live" />
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.02em] text-text">Add a photo</h1>
            <p className="mt-1.5 text-[14px] text-text-2">
              Upload one, or just pick a color — totally optional.
            </p>

            <div className="mt-5 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-24 w-24 items-center justify-center rounded-full text-[32px] font-semibold text-white"
                style={{ backgroundColor: avatarPhoto ? undefined : avatarColor }}
              >
                {avatarPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPhoto}
                    alt=""
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  (name.charAt(0) || "?").toUpperCase()
                )}
                <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg bg-surface-3 text-text">
                  <CameraIcon width={15} height={15} />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {avatarPhoto && (
                <button
                  type="button"
                  onClick={() => setAvatarPhoto(null)}
                  className="text-[13px] text-text-3 underline underline-offset-4"
                >
                  Remove photo
                </button>
              )}

              <div className="flex items-center gap-2.5">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    aria-label={`Use color ${color}`}
                    className="h-8 w-8 rounded-full transition-transform duration-150"
                    style={{
                      backgroundColor: color,
                      outline: avatarColor === color ? `2px solid var(--text)` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-[26px] font-bold tracking-[-0.02em] text-text">
              Write a short bio
            </h1>
            <p className="mt-1.5 text-[14px] text-text-2">Shows up on your profile. Optional.</p>
            <textarea
              autoFocus
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 140))}
              placeholder="Studying IGCSE the lazy way…"
              rows={3}
              className="mt-5 w-full resize-none rounded-sheet border border-hairline bg-surface px-4 py-3 text-[15px] text-text placeholder:text-text-4 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1.5 text-right text-[12px] tabular-nums text-text-4">
              {bio.length}/140
            </p>
          </div>
        )}
      </div>

      <div className="flex w-full max-w-[360px] items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="h-12 flex-1 rounded-pill border border-hairline text-[15px] font-medium text-text-2 transition-colors duration-150 active:bg-surface-2"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || saving}
          className="h-12 flex-[2] rounded-pill bg-accent-strong text-[15px] font-semibold text-white transition-transform duration-100 ease-out active:scale-[0.97] disabled:opacity-40"
        >
          {saving ? "Saving…" : isLastStep ? "Get started" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <OnboardingForm />
      </Suspense>
    </AuthGuard>
  );
}
