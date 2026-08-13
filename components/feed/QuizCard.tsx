"use client";

import { useState } from "react";
import { CheckIcon, XIcon } from "@/components/icons";
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

  const revealed = selected !== null;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-video px-6">
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-3">
        Active Recall
      </span>

      <p className="max-w-[360px] text-balance text-center text-[clamp(20px,3.4vw,26px)] font-bold leading-[1.25] tracking-[-0.02em] text-text">
        {quiz.question}
      </p>

      <div className="w-full max-w-[400px] overflow-hidden rounded-panel bg-surface shadow-panel">
        {quiz.options.map((option, index) => {
          const isCorrect = index === quiz.correct_index;
          const isSelected = index === selected;
          const showCorrect = revealed && isCorrect;
          const showWrong = revealed && isSelected && !isCorrect;
          const dimmed = revealed && !isSelected && !isCorrect;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={revealed}
              className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[15px] font-medium transition-colors duration-150 ${
                index > 0 ? "border-t border-hairline" : ""
              } ${!revealed ? "text-text active:bg-surface-2" : ""} ${
                showCorrect ? "bg-surface-2 text-text" : ""
              } ${showWrong ? "bg-surface-2 text-text" : ""} ${dimmed ? "text-text-3" : ""}`}
            >
              <span>{option}</span>
              {showCorrect && <CheckIcon width={18} height={18} className="shrink-0 text-live" />}
              {showWrong && <XIcon width={18} height={18} className="shrink-0 text-danger" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
