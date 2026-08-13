import Link from "next/link";
import { ChevronRightIcon, FlameIcon } from "@/components/icons";
import { mockFriends, mockLastMessage } from "@/lib/mock-data";

export default function ChatInboxPage() {
  return (
    <div className="h-screen w-full overflow-y-auto bg-bg pb-[100px] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-[560px] px-4">
        <h1 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-text">Chat</h1>

        <div className="overflow-hidden rounded-panel bg-surface shadow-panel">
          {mockFriends.map((friend, index) => (
            <Link
              key={friend.id}
              href={`/chat/${friend.id}`}
              className={`flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors duration-150 active:bg-surface-2 ${
                index > 0 ? "border-t border-hairline" : ""
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[15px] font-semibold text-text">
                {friend.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[15px] font-medium text-text">{friend.name}</span>
                  <span className="flex items-center gap-0.5 text-[11px] tabular-nums text-text-3">
                    <FlameIcon width={12} height={12} className="text-accent" />
                    {friend.streak_count}
                  </span>
                </span>
                <span className="block truncate text-[13px] text-text-2">
                  {mockLastMessage[friend.id]}
                </span>
              </span>
              <ChevronRightIcon width={18} height={18} className="shrink-0 text-text-4" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
