"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`glass-nav sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-hairline" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1080px] items-center justify-between px-[22px]">
        <Link href="/" className="text-[15px] font-semibold tracking-[-0.01em] text-text">
          The Lyceum
        </Link>
        <Link
          href="/feed"
          className="flex h-9 items-center rounded-pill bg-white/[0.06] px-4 text-[13px] font-medium text-text transition-colors duration-150 hover:bg-white/[0.1]"
        >
          Open the feed
        </Link>
      </div>
    </header>
  );
}
