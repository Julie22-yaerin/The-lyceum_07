import HomeClient from "@/app/home-client";
import { mockFriends, mockQuizzes, mockVideos } from "@/lib/mock-data";

export default function Home() {
  return <HomeClient videos={mockVideos} quizzes={mockQuizzes} friends={mockFriends} />;
}
