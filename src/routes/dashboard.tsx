import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, Flame } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { useUserProfile } from "@/context/UserProfileContext";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Home · Juno" }] }),
  component: Dashboard,
});

const WEEKLY_GOAL = 4;
const MINUTES_GOAL = 150;

function Dashboard() {
  const { profile } = useUserProfile();
  const { stats } = profile;
  const status =
    profile.pregnancyStatus === "postpartum"
      ? "Postpartum"
      : profile.trimester
      ? `${profile.trimester} Trimester${profile.weeksPregnant ? ` · ${profile.weeksPregnant} weeks pregnant` : ""}`
      : "Welcome to Juno";

  const weeklyPct = Math.min(100, (stats.workoutsCompleted / WEEKLY_GOAL) * 100);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo />
      </header>

      <main className="mx-auto max-w-md space-y-5 px-6 animate-fade-up">
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
              <div className="mt-1 text-sm text-muted-foreground">
                20 min · Moderate · {profile.trimester ? `${profile.trimester} Trimester` : "All Trimesters"}
              </div>
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
            <div className="text-sm font-semibold text-foreground">
              {stats.workoutsCompleted} / {WEEKLY_GOAL} workouts
            </div>
            <div className="text-xs text-muted-foreground">{Math.round(weeklyPct)}%</div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-tint">
            <div className="h-full bg-gradient-to-r from-primary to-primary-light transition-all" style={{ width: `${weeklyPct}%` }} />
          </div>
          {stats.workoutsCompleted === 0 && (
            <p className="mt-3 text-xs italic text-muted-foreground">
              Your first session is just one tap away. 💜
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <QuickAction to="/workouts" icon={<Dumbbell className="h-4 w-4" />} label="Start Workout" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Minutes Active" value={String(stats.minutesActive)} sub={`/ ${MINUTES_GOAL}`} />
          <Stat label="Streak" value={String(stats.streakDays)} sub={stats.streakDays === 0 ? "days" : "days 🔥"} icon={stats.streakDays > 0 ? <Flame className="h-3 w-3 text-warning" /> : null} />
          <Stat label="Confidence" value={stats.confidence ? `${stats.confidence}%` : "—"} sub={stats.confidence ? "💜" : "start to see"} />
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

function Stat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="card-bloom p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        {icon}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-serif text-2xl text-primary-dark">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
