import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Activity, Mic, Sparkles, TrendingUp } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "bloom — Move safely. Feel confident." },
      { name: "description", content: "AI-powered prenatal fitness coaching for every stage of your journey." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-5 lg:px-12">
        <Logo />
      </header>

      <main className="grid min-h-[calc(100vh-80px)] gap-12 px-6 pb-12 lg:grid-cols-2 lg:px-12">
        {/* Left */}
        <div className="flex flex-col justify-center max-w-xl animate-fade-up">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-tint px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Prenatal Fitness
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-foreground lg:text-6xl">
            Move safely.<br />Feel confident.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            AI-powered pregnancy exercise coaching for every stage of your journey. Real-time pose
            guidance meets trauma-informed support.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { Icon: Activity, label: "Real-time Pose Tracking" },
              { Icon: Mic, label: "Personalized Voice Feedback" },
              { Icon: Heart, label: "Loss-Aware Coaching" },
              { Icon: TrendingUp, label: "Progress Tracking" },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-3 rounded-2xl bg-white/60 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className="btn-primary text-center hover:opacity-95">
              Get Started →
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-primary/20 bg-white px-6 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary-tint"
            >
              I already have an account
            </Link>
          </div>
        </div>

        {/* Right visual */}
        <div className="relative flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#E8DEFF] to-[#F8F5FE] p-8 min-h-[560px]">
          {/* decorative blobs */}
          <div className="absolute -top-10 -left-10 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-primary-light/25 blur-3xl" />

          {/* phone mock */}
          <div className="relative z-10 w-[280px] rounded-[2.5rem] bg-[#1A1A1A] p-3 shadow-bloom-lg ring-8 ring-white/40 animate-float">
            <div className="relative h-[500px] overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#2A1A4A] to-[#0F0820]">
              {/* skeleton dots */}
              <svg viewBox="0 0 200 350" className="absolute inset-0 h-full w-full">
                <g stroke="#A78BDB" strokeWidth="2" opacity="0.7">
                  <line x1="80" y1="90" x2="120" y2="90" />
                  <line x1="80" y1="90" x2="60" y2="140" />
                  <line x1="120" y1="90" x2="140" y2="140" />
                  <line x1="100" y1="90" x2="100" y2="180" />
                  <line x1="100" y1="180" x2="75" y2="240" />
                  <line x1="100" y1="180" x2="125" y2="240" />
                  <line x1="75" y1="240" x2="70" y2="300" />
                  <line x1="125" y1="240" x2="130" y2="300" />
                </g>
                {[
                  [100, 70], [80, 90], [120, 90], [60, 140], [140, 140],
                  [100, 180], [75, 240], [125, 240], [70, 300], [130, 300],
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="5" fill="#C9B5F0" style={{ filter: "drop-shadow(0 0 6px #A78BDB)" }} />
                ))}
              </svg>

              <div className="absolute left-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                Pregnancy-Safe Squat
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex justify-between rounded-2xl bg-white/10 px-3 py-2 text-[10px] font-medium text-white backdrop-blur">
                <span>8 REPS</span><span>Set 2/3</span><span>⏱ 10:24</span>
              </div>
            </div>
          </div>

          {/* floating badges */}
          <div className="absolute left-6 top-12 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-primary-dark shadow-bloom animate-float" style={{ animationDelay: "0.5s" }}>
            Great posture! 🤍
          </div>
          <div className="absolute right-8 top-32 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-success shadow-bloom animate-float" style={{ animationDelay: "1s" }}>
            Knees aligned ✓
          </div>
          <div className="absolute right-4 bottom-24 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-primary shadow-bloom animate-float" style={{ animationDelay: "1.5s" }}>
            85% Confidence
          </div>
          <div className="absolute left-4 bottom-16 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-primary-dark shadow-bloom animate-float" style={{ animationDelay: "2s" }}>
            Move safely 💜
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-white px-6 py-6 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            <span className="font-serif text-base text-primary-dark">bloom</span> · Built for every stage of pregnancy
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>🩺 Doctor-Aware Guidance</span>
            <span>·</span>
            <span>🌸 Safe & Gentle Movement</span>
            <span>·</span>
            <span>🔬 Backed by Women's Health Research</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
