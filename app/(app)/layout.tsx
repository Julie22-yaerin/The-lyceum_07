import AuthGuard from "@/components/AuthGuard";
import TabBar from "@/components/nav/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="relative h-screen w-full bg-bg">
        {children}
        <TabBar />
      </div>
    </AuthGuard>
  );
}
