import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Share2 } from "lucide-react";
import { useUserProfile } from "@/context/UserProfileContext";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Results · bloom" }] }),
  component: Results,
});

function Results() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl space-y-5 animate-fade-up">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-foreground">Great job, {profile.firstName}! 🎉</h1>
          <p className="mt-1 text-sm text-muted-foreground">You completed Lower Body Strength</p>
        </div>

        <div className="card-bloom p-6 text-center">
          <Ring value={82} label="Great" />
          <ul className="mt-6 space-y-3 text-left text-sm">
            <Row color="bg-success" label="Knee Alignment" value="Good" />
            <Row color="bg-success" label="Back Posture" value="Great" />
            <Row color="bg-success" label="Depth" value="Good" />
            <Row color="bg-warning" label="Core Engagement" value="Needs a little more" />
          </ul>
        </div>

        <div className="rounded-2xl bg-primary-tint p-5">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <p className="text-sm text-primary-dark">
              Your movement looked controlled. Try engaging your core slightly more throughout the exercise.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Chip label="Duration" value="20:15" />
          <Chip label="Reps" value="24" />
          <Chip label="Sets" value="3/3" />
        </div>

        <div className="space-y-3 pt-2">
          <button onClick={() => navigate({ to: "/dashboard" })} className="btn-primary w-full">Finish</button>
          <button className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/20 bg-white py-3 text-sm font-semibold text-primary hover:bg-primary-tint">
            <Share2 className="h-4 w-4" /> Share your progress
          </button>
        </div>
      </div>
    </div>
  );
}

function Ring({ value, label }: { value: number; label: string }) {
  const r = 50, c = 2 * Math.PI * r, off = c - (value / 100) * c;
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="var(--primary-tint)" strokeWidth="10" fill="none" />
        <circle cx="60" cy="60" r={r} stroke="url(#gg)" strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} />
        <defs>
          <linearGradient id="gg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7C5CBF" /><stop offset="100%" stopColor="#A78BDB" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif text-4xl text-primary-dark">{value}%</div>
        <div className="text-xs font-semibold uppercase tracking-wide text-success">{label}</div>
      </div>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </li>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-bloom p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-serif text-lg text-primary-dark">{value}</div>
    </div>
  );
}
