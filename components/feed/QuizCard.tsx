"use client";

import { useState } from "react";
import type { QuizCardData } from "@/lib/types";

interface QuizCardProps {
  quiz: QuizCardData;
}

export default function QuizCard({ quiz }: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-black px-6 text-white">
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/70">
        Active Recall
      </span>
      <p className="max-w-md text-center text-xl font-semibold">{quiz.question}</p>
      <div className="flex w-full max-w-md flex-col gap-3">
        {quiz.options.map((option, index) => {
          const isCorrect = index === quiz.correct_index;
          const isSelected = index === selected;
          const revealed = selected !== null;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={revealed}
              className={[
                "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                !revealed && "border-white/20 bg-white/5 hover:bg-white/10",
                revealed && isCorrect && "border-emerald-400 bg-emerald-400/20",
                revealed && isSelected && !isCorrect && "border-rose-400 bg-rose-400/20",
                revealed && !isSelected && !isCorrect && "border-white/10 bg-white/5 opacity-60",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
