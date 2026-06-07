import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Volume2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/workout/$id")({
  head: () => ({ meta: [{ title: "Live workout · bloom" }] }),
  component: LiveWorkout,
});

function LiveWorkout() {
  const navigate = useNavigate();

  const playVoice = () => {
    toast("🔊 Voice coaching powered by ElevenLabs — coming soon", {
      duration: 3000,
      style: { background: "linear-gradient(135deg,#7C5CBF,#A78BDB)", color: "white", border: "none" },
    });
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1.85fr_1fr] lg:p-6">
        {/* Camera area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#1A1A1A] ring-1 ring-white/5">
          {/* grid */}
          <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#A78BDB" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* watermark */}
          <div className="absolute left-4 top-4 z-10 font-serif text-base lowercase text-white/60">bloom</div>

          {/* exercise pill */}
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur">
            Pregnancy-Safe Squat
          </div>

          {/* voice button */}
          <button
            onClick={playVoice}
            className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-primary-dark shadow-bloom transition-transform hover:scale-105"
          >
            <Volume2 className="h-4 w-4" /> Voice Coach
          </button>

          {/* pose skeleton */}
          <svg viewBox="0 0 400 400" className="absolute inset-0 mx-auto h-full">
            <defs>
              <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <g stroke="#A78BDB" strokeWidth="3" strokeLinecap="round" opacity="0.85" filter="url(#glow)">
              {/* squat pose */}
              <line x1="200" y1="110" x2="200" y2="170" /> {/* neck-spine */}
              <line x1="160" y1="160" x2="240" y2="160" /> {/* shoulders */}
              <line x1="160" y1="160" x2="140" y2="220" /> {/* L upper arm */}
              <line x1="140" y1="220" x2="155" y2="265" /> {/* L forearm */}
              <line x1="240" y1="160" x2="260" y2="220" />
              <line x1="260" y1="220" x2="245" y2="265" />
              <line x1="200" y1="170" x2="200" y2="235" /> {/* torso to hip */}
              <line x1="175" y1="235" x2="225" y2="235" /> {/* hips */}
              <line x1="175" y1="235" x2="155" y2="295" /> {/* L thigh */}
              <line x1="155" y1="295" x2="170" y2="355" /> {/* L shin */}
              <line x1="225" y1="235" x2="245" y2="295" />
              <line x1="245" y1="295" x2="230" y2="355" />
            </g>
            {[
              [200, 100], [160, 160], [240, 160], [140, 220], [260, 220], [155, 265], [245, 265],
              [175, 235], [225, 235], [155, 295], [245, 295], [170, 355], [230, 355],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="6" fill="#C9B5F0" filter="url(#glow)" />
            ))}
          </svg>

          {/* floating cards */}
          <FloatCard pos="left-4 top-20" emoji="💜" text="Great posture! Keep your chest open and shoulders relaxed." />
          <FloatCard pos="right-4 top-24" emoji="✓" text="Engage core gently. You're doing great!" color="text-primary" />
          <FloatCard pos="left-4 bottom-24" emoji="⭐" text="Stable & grounded. Press through your feet." />
          <FloatCard pos="right-4 bottom-28" emoji="✅" text="Knees aligned. Keep them in line with your toes." color="text-success" />

          {/* bottom stats */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-2">
            {[
              { v: "8", l: "REPS" },
              { v: "2/3", l: "SET" },
              { v: "10:24", l: "⏱ TIME" },
            ].map((s) => (
              <div key={s.l} className="flex-1 rounded-2xl bg-white/10 px-3 py-2 text-center backdrop-blur">
                <div className="text-lg font-bold">{s.v}</div>
                <div className="text-[10px] text-white/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 text-foreground">
          <div className="card-bloom p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Live Feedback</h3>
              <Volume2 className="h-4 w-4 text-primary" />
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <FeedbackRow color="bg-success" label="Great posture" />
              <FeedbackRow color="bg-success" label="Knees aligned" />
              <FeedbackRow color="bg-warning" label="Engage core gently" />
              <FeedbackRow color="bg-success" label="Move at a comfortable pace" />
            </ul>
            <p className="mt-4 italic text-xs text-primary">"Listening to your body is the best guide."</p>
          </div>

          <div className="card-bloom p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">AI Coach</h3>
            </div>
            <div className="relative mt-3 rounded-2xl bg-primary-tint p-4 text-sm text-primary-dark">
              You're moving beautifully today. Take it slow and listen to your body.
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Volume2 className="h-3 w-3" /> Voice Coach
            </div>
          </div>

          <div className="card-bloom p-5 text-center">
            <ConfidenceRing value={85} />
            <p className="mt-3 text-xs text-muted-foreground">
              You're building strength and confidence one step at a time. 💜
            </p>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-6 lg:px-6">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#1A1A1A] px-5 py-4 ring-1 ring-white/5">
          <p className="flex-1 text-xs italic text-white/60">
            Remember: Stop if you feel pain, dizziness, bleeding, contractions, or anything unusual. Always follow your clinician's advice.
          </p>
          <button
            onClick={() => navigate({ to: "/results" })}
            className="flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <X className="h-4 w-4" /> End Workout
          </button>
        </div>
      </div>
    </div>
  );
}

function FloatCard({ pos, emoji, text, color = "text-primary-dark" }: { pos: string; emoji: string; text: string; color?: string }) {
  return (
    <div className={`absolute ${pos} z-10 max-w-[200px] rounded-2xl bg-white p-3 text-[11px] font-medium shadow-bloom ${color} animate-float`}>
      <span className="mr-1.5">{emoji}</span>{text}
    </div>
  );
}

function FeedbackRow({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-foreground">{label}</span>
    </li>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 42, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative mx-auto h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="var(--primary-tint)" strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r={r} stroke="url(#g)" strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} />
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7C5CBF" /><stop offset="100%" stopColor="#A78BDB" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif text-2xl text-primary-dark">{value}%</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Confidence</div>
      </div>
    </div>
  );
}
