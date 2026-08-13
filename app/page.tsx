import Link from "next/link";
import LandingNav from "@/components/marketing/LandingNav";

const steps = [
  {
    n: "01",
    title: "Scroll like you always do",
    body: "Same endless, addictive feed you already open forty times a day. Nothing to learn, nothing to install.",
  },
  {
    n: "02",
    title: "Real topics sneak in",
    body: "Between the memes, IGCSE-level concepts play as native video slides — three study clips for every meme.",
  },
  {
    n: "03",
    title: "Active Recall locks it in",
    body: "Every few videos, a quick quiz card checks what actually stuck. No cramming, no flashcard app.",
  },
];

const features = [
  {
    title: "Interleaved Feed",
    body: "A 3:1:1 mix of study clips, entertainment, and recall — tuned so the ratio does the studying for you.",
  },
  {
    title: "Active Recall Quizzes",
    body: "A ten-second check-in, not a test. Answer wrong and the concept resurfaces sooner.",
  },
  {
    title: "Friend Streaks",
    body: "Share a clip, keep a streak. Studying stays a habit you keep with people, not a chore you keep alone.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto max-w-[720px] px-[22px] pb-[clamp(20px,4vw,32px)] pt-[clamp(56px,10vw,96px)]">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Study, but lazy
        </div>
        <h1 className="mt-4 text-balance text-[clamp(34px,6.5vw,58px)] font-bold leading-[1.08] tracking-[-0.03em] text-text">
          The unfair advantage for laziness.
        </h1>
        <p className="mt-4 max-w-[540px] text-[clamp(16px,2.6vw,18px)] leading-[1.6] text-text-2">
          The Lyceum hides real coursework inside the doomscroll you were going to do anyway.
          Open it like TikTok, close it having actually studied.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="/onboarding"
            className="flex h-11 items-center rounded-pill bg-accent-strong px-6 text-[15px] font-semibold text-white transition-transform duration-100 ease-out active:scale-[0.97]"
          >
            Start scrolling
          </Link>
          <a
            href="#how-it-works"
            className="flex h-11 items-center rounded-pill border border-hairline px-5 text-[14px] font-medium text-text-2 transition-colors duration-150 hover:bg-surface-2"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* How it works — unified panel, not fragmented cards */}
      <section id="how-it-works" className="mx-auto max-w-[720px] px-[22px] pb-[clamp(34px,6vw,56px)]">
        <div className="overflow-hidden rounded-panel bg-surface shadow-panel">
          {steps.map((step, index) => (
            <div
              key={step.n}
              className={`flex gap-5 px-[clamp(17px,3vw,24px)] py-5 ${index > 0 ? "border-t border-hairline" : ""}`}
            >
              <span className="tabular-nums text-[15px] font-semibold text-text-4">{step.n}</span>
              <div>
                <h3 className="text-[17px] font-semibold leading-[1.4] tracking-[-0.01em] text-text">
                  {step.title}
                </h3>
                <p className="mt-1 text-[13.5px] leading-[1.6] text-text-2">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid — genuinely independent items */}
      <section className="mx-auto max-w-[1080px] px-[22px] pb-[clamp(34px,6vw,56px)]">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-card bg-surface p-[18px] shadow-panel transition-transform duration-200 ease-out-quart hover:-translate-y-[3px]"
            >
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-text">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-[1.5] text-text-2">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Colored CTA — the one place color fills the frame */}
      <section className="mx-auto max-w-[1080px] px-[22px] pb-[clamp(34px,6vw,56px)]">
        <div
          className="relative overflow-hidden rounded-hero p-[clamp(26px,4vw,40px)]"
          style={{
            background: "linear-gradient(135deg, #0a84ff 0%, #003a95 100%)",
            boxShadow: "0 20px 54px rgba(10,132,255,0.28)",
          }}
        >
          <div
            className="absolute -right-10 -top-20 h-[260px] w-[260px] rounded-full bg-white/[0.18]"
            style={{ filter: "blur(46px)" }}
          />
          <div
            className="absolute -bottom-24 left-[12%] h-[200px] w-[200px] rounded-full bg-white/[0.14]"
            style={{ filter: "blur(50px)" }}
          />
          <div className="relative">
            <h2 className="text-[clamp(20px,3.4vw,28px)] font-bold tracking-[-0.02em] text-white">
              Ready to be productively lazy?
            </h2>
            <p className="mt-2.5 max-w-[460px] text-[14px] leading-[1.6] text-white/80">
              No sign-up flow to sit through. Open the feed and the first quiz is four videos away.
            </p>
            <Link
              href="/feed"
              className="mt-5 inline-flex h-[42px] items-center rounded-pill border border-white/[0.22] bg-white/[0.16] px-5 text-[13.5px] font-semibold text-white backdrop-blur-[8px] transition-transform duration-100 ease-out active:scale-[0.97]"
            >
              Open the feed →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-[1080px] px-[22px] py-8">
        <div className="flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-text-2">
            The Lyceum — the unfair advantage for laziness.
          </span>
          <span className="text-[12px] text-text-3">Built for people who scroll anyway.</span>
        </div>
      </footer>
    </div>
  );
}
