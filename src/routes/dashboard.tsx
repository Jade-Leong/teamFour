import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, Bot, Wind, Flame } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { useUserProfile } from "@/context/UserProfileContext";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Home · bloom" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useUserProfile();
  const status = profile.pregnancyStatus === "postpartum"
    ? "Postpartum"
    : `${profile.trimester ?? "2nd"} Trimester · ${profile.weeksPregnant} weeks pregnant`;

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo />
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-6 animate-fade-up">
        <div>
          <h1 className="font-serif text-4xl text-foreground">
            Good morning, {profile.firstName} 🌸
          </h1>
          <span className="mt-3 inline-block rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary">
            {status}
          </span>
        </div>

        {/* Today's plan */}
        <div className="card-bloom relative overflow-hidden border-l-4 border-primary p-6">
          <div className="text-[11px] font-bold uppercase tracking-widest text-primary">Today's Plan</div>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <div className="font-serif text-2xl text-foreground">Lower Body Strength</div>
              <div className="mt-1 text-sm text-muted-foreground">20 min · Moderate · 2nd Trimester</div>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-tint to-primary-light/40 text-2xl">
              🤰
            </div>
          </div>
          <Link to="/workout/$id" params={{ id: "squat" }} className="btn-primary mt-4 inline-flex hover:opacity-95">
            Start Workout →
          </Link>
        </div>

        {/* Weekly */}
        <div className="card-bloom p-6">
          <div className="text-[11px] font-bold uppercase tracking-widest text-primary">This Week's Progress</div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-sm font-semibold text-foreground">2 / 4 workouts</div>
            <div className="text-xs text-muted-foreground">50%</div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-tint">
            <div className="h-full bg-gradient-to-r from-primary to-primary-light" style={{ width: "50%" }} />
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <QuickAction to="/workouts" icon={<Dumbbell className="h-4 w-4" />} label="Start Workout" />
          <QuickAction to="/coach" icon={<Bot className="h-4 w-4" />} label="AI Coach" />
          <QuickAction to="/workout/$id" params={{ id: "breathing" }} icon={<Wind className="h-4 w-4" />} label="Calm Breathing" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Minutes Active" value="85" sub="/ 150" />
          <Stat label="Streak" value="3" sub="days 🔥" icon={<Flame className="h-3 w-3" />} />
          <Stat label="Confidence" value="82%" sub="💜" />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function QuickAction({ to, params, icon, label }: { to: any; params?: any; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} params={params} className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-primary-dark shadow-bloom hover:bg-primary-tint">
      <span className="text-primary">{icon}</span> {label}
    </Link>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="card-bloom p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-serif text-2xl text-primary-dark">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
