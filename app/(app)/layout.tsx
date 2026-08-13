import TabBar from "@/components/nav/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-screen w-full bg-bg">
      {children}
      <TabBar />
    </div>
  );
}
