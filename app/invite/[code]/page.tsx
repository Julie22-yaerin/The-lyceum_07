import Link from "next/link";
import { FlameIcon } from "@/components/icons";

export default function InvitePage({ params }: { params: { code: string } }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-bg px-6 text-center">
      <span className="flex items-center gap-1.5 rounded-pill border border-hairline px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-accent">
        <FlameIcon width={14} height={14} />
        You&apos;re invited
      </span>

      <h1 className="mt-5 max-w-[420px] text-balance text-[clamp(28px,5vw,40px)] font-bold leading-[1.12] tracking-[-0.03em] text-text">
        A friend sent you 40% off The Lyceum.
      </h1>
      <p className="mt-3 max-w-[420px] text-[15px] leading-[1.6] text-text-2">
        Join with code <span className="font-mono text-text">{params.code}</span> and you both
        unlock each other&apos;s fetched reels — plus 40% off, on us.
      </p>

      <Link
        href="/feed"
        className="mt-7 flex h-11 items-center rounded-pill bg-accent-strong px-6 text-[15px] font-semibold text-white transition-transform duration-100 ease-out active:scale-[0.97]"
      >
        Claim & open the feed
      </Link>

      <Link href="/" className="mt-4 text-[13px] text-text-3 underline underline-offset-4">
        What is The Lyceum?
      </Link>
    </div>
  );
}
