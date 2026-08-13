import FeedScroll from "@/components/feed/FeedScroll";
import { mockQuizzes, mockVideos } from "@/lib/mock-data";

export default function Home() {
  return <FeedScroll videos={mockVideos} quizzes={mockQuizzes} />;
}
