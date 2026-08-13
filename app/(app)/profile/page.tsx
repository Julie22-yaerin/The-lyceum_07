"use client";

import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AwardIcon, ChevronRightIcon, CopyIcon, FlameIcon } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";
import { auth } from "@/lib/firebase/client";
import { mockAchievements, mockFriends, mockProfile } from "@/lib/mock-data";
import { getStoredProfile } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [inviteLink, setInviteLink] = useState(
    `https://thelyceum.app/invite/${mockProfile.referralCode}`
  );

  useEffect(() => {
    getStoredProfile().then((stored) => {
      if (stored) setProfile((prev) => ({ ...prev, ...stored }));
    });
    setInviteLink(`${window.location.origin}/invite/${mockProfile.referralCode}`);
  }, []);

  const topStreak = mockFriends.reduce((max, f) => Math.max(max, f.streak_count), 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-bg pb-[100px] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-[560px] px-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-[24px] font-semibold text-white"
              style={{ backgroundColor: profile.avatarPhoto ? undefined : profile.avatarColor }}
            >
              {profile.avatarPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </span>
            <div>
              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-text">
                {profile.name}
              </h1>
              <p className="text-[13.5px] text-text-2">{profile.handle}</p>
            </div>
          </div>
          <Link
            href="/onboarding?next=/profile"
            className="flex h-9 shrink-0 items-center rounded-pill border border-hairline px-3.5 text-[13px] font-medium text-text-2 transition-colors duration-150 active:bg-surface-2"
          >
            Edit
          </Link>
        </div>

        {profile.bio && (
          <p className="mt-3 text-[14px] leading-[1.5] text-text-2">{profile.bio}</p>
        )}

        {/* Stats row — one panel, hairline-divided columns */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-hairline overflow-hidden rounded-panel bg-surface shadow-panel">
          <div className="flex flex-col items-center gap-0.5 py-4">
            <span className="tabular-nums text-[18px] font-bold text-text">{mockFriends.length}</span>
            <span className="text-[11.5px] text-text-3">Friends</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-4">
            <span className="flex items-center gap-1 tabular-nums text-[18px] font-bold text-text">
              <FlameIcon width={15} height={15} className="text-accent" />
              {topStreak}
            </span>
            <span className="text-[11.5px] text-text-3">Best streak</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-4">
            <span className="tabular-nums text-[18px] font-bold text-text">128</span>
            <span className="text-[11.5px] text-text-3">Reels watched</span>
          </div>
        </div>

        {/* Achievements — independent badges, card grid */}
        <div className="mt-5">
          <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-3">
            Achievements
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {mockAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-card bg-surface p-3.5 shadow-panel ${
                  achievement.earned ? "" : "opacity-40"
                }`}
              >
                <AwardIcon
                  width={20}
                  height={20}
                  className={achievement.earned ? "text-accent" : "text-text-4"}
                />
                <h3 className="mt-2 text-[14px] font-semibold text-text">{achievement.title}</h3>
                <p className="mt-0.5 text-[12px] leading-[1.4] text-text-2">
                  {achievement.caption}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Invite panel */}
        <div className="mt-5 overflow-hidden rounded-panel bg-surface p-[18px] shadow-panel">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-text">
            Invite a friend
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-[1.55] text-text-2">
            Send your link — you both get 40% off, and you unlock each other&apos;s fetched
            reels the moment they join.
          </p>
          <div className="mt-3.5 flex items-center gap-2">
            <div className="h-11 flex-1 overflow-hidden rounded-sheet border border-hairline bg-bg px-3.5">
              <span className="flex h-full items-center truncate font-mono text-[13px] text-text-2">
                {inviteLink}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-11 items-center gap-1.5 rounded-sheet bg-accent-strong px-4 text-[13.5px] font-semibold text-white transition-transform duration-100 ease-out active:scale-[0.97]"
            >
              <CopyIcon width={16} height={16} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Friends list */}
        <div className="mt-5 overflow-hidden rounded-panel bg-surface shadow-panel">
          {mockFriends.map((friend, index) => (
            <Link
              key={friend.id}
              href={`/chat/${friend.id}`}
              className={`flex min-h-[60px] items-center gap-3 px-4 py-3 transition-colors duration-150 active:bg-surface-2 ${
                index > 0 ? "border-t border-hairline" : ""
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[14px] font-semibold text-text">
                {friend.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 text-[15px] font-medium text-text">{friend.name}</span>
              <span className="flex items-center gap-1 text-[12px] tabular-nums text-text-3">
                <FlameIcon width={13} height={13} className="text-accent" />
                {friend.streak_count}
              </span>
              <ChevronRightIcon width={18} height={18} className="shrink-0 text-text-4" />
            </Link>
          ))}
        </div>

        {/* Appearance */}
        <div className="mt-5 overflow-hidden rounded-panel bg-surface shadow-panel">
          <div className="flex min-h-[56px] items-center justify-between px-4 py-3">
            <span className="text-[15px] font-medium text-text">Appearance</span>
            <ThemeToggle className="bg-surface-3" />
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={() => signOut(auth).then(() => router.replace("/login"))}
          className="mb-6 mt-5 flex h-12 w-full items-center justify-center rounded-panel bg-surface text-[15px] font-medium text-danger shadow-panel transition-colors duration-150 active:bg-surface-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
