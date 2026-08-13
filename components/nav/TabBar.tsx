"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, ReelsIcon, UserIcon } from "@/components/icons";

const TABS = [
  { href: "/feed", label: "Reels", icon: ReelsIcon },
  { href: "/chat", label: "Chat", icon: ChatIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  // Chat threads get their own message-input bar — hide the tab bar there.
  if (pathname.startsWith("/chat/") && pathname !== "/chat/") {
    return null;
  }

  return (
    <nav
      className="glass-nav fixed inset-x-0 bottom-0 z-30 flex items-start justify-around border-t border-hairline pt-2"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex w-16 flex-col items-center gap-1 py-1 text-[10px] font-medium ${
              isActive ? "text-accent" : "text-text-3"
            }`}
          >
            <Icon width={26} height={26} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
