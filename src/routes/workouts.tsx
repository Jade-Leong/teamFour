import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/workouts")({
  head: () => ({ meta: [{ title: "Workouts · Juno" }] }),
  component: Workouts,
});

const categories = ["All", "Strength", "Mobility", "Pelvic Floor", "Stretching", "Breathing"];

const workouts = [
  { id: "squat", name: "Lower Body Strength", duration: "20 min", level: "Moderate", trimester: "2nd Trimester", emoji: "🦵" },
  { id: "mobility", name: "Gentle Mobility Flow", duration: "15 min", level: "Easy", trimester: "All Trimesters", emoji: "🌊" },
  { id: "pelvic", name: "Pelvic Floor & Core", duration: "15 min", level: "Easy", trimester: "All Trimesters", emoji: "🌸" },
  { id: "fullbody", name: "Full Body Flow", duration: "25 min", level: "Moderate", trimester: "2nd & 3rd", emoji: "✨" },
  { id: "upper", name: "Upper Body Strength", duration: "18 min", level: "Easy", trimester: "2nd Trimester", emoji: "💪" },
  { id: "breathing", name: "Breathing & Relaxation", duration: "10 min", level: "Easy", trimester: "All Trimesters", emoji: "🌬️" },
];

function Workouts() {
  const [active, setActive] = useState("All");
  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-6 pt-6">
        <h1 className="font-serif text-4xl">Workouts</h1>

        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="input-bloom pl-11" placeholder="Search workouts…" />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                active === c ? "bg-gradient-to-r from-primary to-primary-light text-white" : "bg-white text-muted-foreground hover:text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <main className="mt-2 space-y-3 px-6">
        {workouts.map((w, i) => (
          <Link
            key={w.id}
            to="/workout/$id"
            params={{ id: w.id }}
            style={{ animationDelay: `${i * 60}ms` }}
            className="card-bloom flex animate-fade-up items-center gap-4 p-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-tint to-primary-light/40 text-2xl">
              {w.emoji}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{w.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {w.duration} · {w.level} · {w.trimester}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
