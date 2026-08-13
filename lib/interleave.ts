import type { FeedSlide, QuizCardData, VideoItem } from "./types";

const QUIZ_INTERVAL = 4;

/**
 * Inserts an Active Recall Quiz Card after every Nth video item.
 * The 3-edu : 1-meme composition of each group of `videos` is expected
 * to already be ordered upstream (content selection query); this only
 * handles quiz interleaving.
 */
export function buildInterleavedFeed(
  videos: VideoItem[],
  quizzes: QuizCardData[]
): FeedSlide[] {
  const slides: FeedSlide[] = [];
  let quizCursor = 0;

  videos.forEach((video, index) => {
    slides.push({ kind: "video", id: video.id, data: video });

    const isEveryFourth = (index + 1) % QUIZ_INTERVAL === 0;
    if (isEveryFourth && quizzes.length > 0) {
      const quiz = quizzes[quizCursor % quizzes.length];
      slides.push({
        kind: "quiz",
        id: `quiz-${quiz.id}-${index}`,
        data: quiz,
      });
      quizCursor += 1;
    }
  });

  return slides;
}
