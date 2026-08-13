"use client";

import { useState } from "react";
import { SendIcon, SparkleIcon } from "@/components/icons";
import type { FeedSlideContext } from "@/lib/types";

interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantBubbleProps {
  context: FeedSlideContext | null;
}

export default function AssistantBubble({ context }: AssistantBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const contextLabel = !context
    ? "this content"
    : context.kind === "quiz"
      ? "this quiz"
      : context.kind === "meme"
        ? "this meme"
        : `this ${context.topic.replace(/-/g, " ")} video`;

  const handleAsk = async () => {
    const question = draft.trim();
    if (!question || isLoading) return;

    const nextMessages: AssistantMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setDraft("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: context?.detail, messages: nextMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.success
            ? data.answer
            : "Sorry, I couldn't reach the AI just now — try again in a bit.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't reach the AI just now — try again in a bit." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Ask the AI assistant about this content"
        className="absolute left-3 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-accent-strong text-white shadow-overlay transition-transform duration-100 ease-out active:scale-[0.94]"
        style={{ bottom: "max(96px, calc(env(safe-area-inset-bottom) + 84px))" }}
      >
        <SparkleIcon width={22} height={22} />
      </button>

      <div aria-hidden={!isOpen} className={isOpen ? "" : "pointer-events-none"}>
        <div
          onClick={() => setIsOpen(false)}
          className={`app-scrim fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-out-quart ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <div
          role="dialog"
          aria-modal="true"
          className={`app-sheet ${isOpen ? "is-open" : "is-closed"} fixed inset-x-0 bottom-0 z-50 flex h-[65vh] flex-col rounded-t-[var(--r-panel)] border-t border-hairline bg-surface shadow-overlay transition-[transform,opacity] duration-[320ms] ease-spring ${
            isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          }`}
        >
          <div className="mx-auto mt-2.5 h-[5px] w-[38px] shrink-0 rounded-pill bg-faint" />
          <div className="flex items-center gap-1.5 px-5 py-3">
            <SparkleIcon width={14} height={14} className="text-accent" />
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-3">
              Ask about {contextLabel}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-5">
            {messages.length === 0 && (
              <p className="py-8 text-center text-[14px] text-text-3">
                Confused about something? Ask away.
              </p>
            )}
            <div className="flex flex-col gap-3 pb-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-card px-3.5 py-2.5 text-[14px] leading-[1.45] ${
                      message.role === "user" ? "bg-accent-strong text-white" : "bg-surface-2 text-text"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-card bg-surface-2 px-3.5 py-2.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-3 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-3 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-3" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="flex items-center gap-2 border-t border-hairline px-4 py-3"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="What don't you get?"
              className="h-11 flex-1 rounded-pill border border-hairline bg-bg px-4 text-[14px] text-text placeholder:text-text-4 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={!draft.trim() || isLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-strong text-white transition-transform duration-100 ease-out active:scale-[0.97] disabled:opacity-40"
            >
              <SendIcon width={18} height={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
