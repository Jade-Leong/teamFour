import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Volume2, X, Sparkles, Play, Camera } from "lucide-react";
import { toast } from "sonner";
import { useUserProfile, type LastSession } from "@/context/UserProfileContext";

export const Route = createFileRoute("/workout/$id")({
  head: () => ({ meta: [{ title: "Live workout · bloom" }] }),
  component: LiveWorkout,
});

const TARGET_REPS_PER_SET = 12;
const TOTAL_SETS = 3;
const TARGET_DURATION = 20 * 60; // seconds for full session (used by progress bar)

function LiveWorkout() {
  const navigate = useNavigate();
  const { recordSession } = useUserProfile();
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [reps, setReps] = useState(0);
  const [set, setSet] = useState(1);
  const repTimer = useRef<number | null>(null);

  // tick timer + simulate rep cadence so the UI feels live
  useEffect(() => {
    if (!started) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    repTimer.current = window.setInterval(() => {
      setReps((r) => {
        if (r + 1 >= TARGET_REPS_PER_SET) {
          setSet((s) => Math.min(TOTAL_SETS, s + 1));
          return 0;
        }
        return r + 1;
      });
    }, 3500);
    return () => {
      window.clearInterval(t);
      if (repTimer.current) window.clearInterval(repTimer.current);
    };
  }, [started]);

  const playVoice = () => {
    toast("🔊 Voice coaching powered by ElevenLabs — coming soon", {
      duration: 3000,
      style: { background: "linear-gradient(135deg,#7C5CBF,#A78BDB)", color: "white", border: "none" },
    });
  };

  const handleEnd = () => {
    const formScore = started ? Math.min(95, 70 + Math.floor(elapsed / 30)) : 0;
    const totalReps = (set - 1) * TARGET_REPS_PER_SET + reps;
    const session: LastSession = {
      name: "Lower Body Strength",
      durationSec: elapsed,
      reps: totalReps,
      setsCompleted: Math.max(0, set - 1) + (reps > 0 ? 1 : 0),
      totalSets: TOTAL_SETS,
      formScore,
      feedback: {
        kneeAlignment: "good",
        backPosture: "great",
        depth: "good",
        coreEngagement: started ? "needs" : "needs",
      },
    };
    if (started && elapsed > 0) recordSession(session);
    navigate({ to: "/results" });
  };

  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");
  const sessionPct = Math.min(100, (elapsed / TARGET_DURATION) * 100);
  const setPct = (reps / TARGET_REPS_PER_SET) * 100;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1.85fr_1fr] lg:p-6">
        {/* CAMERA / MOTION-DETECTION ZONE (square) */}
        <div>
          <div className="relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-3xl bg-[#1A1A1A] ring-1 ring-white/10">
            {/*
              ─────────────────────────────────────────────────────────────
              MEDIAPIPE MOTION DETECTION MOUNT POINT
              Replace the placeholder content below with:
                <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
              Initialize MediaPipe Pose / Tasks Vision inside a useEffect
              and draw landmarks onto the canvas.
              ─────────────────────────────────────────────────────────────
            */}

            {/* corner brackets to mark the detection zone */}
            {["top-3 left-3 border-l-2 border-t-2", "top-3 right-3 border-r-2 border-t-2", "bottom-3 left-3 border-l-2 border-b-2", "bottom-3 right-3 border-r-2 border-b-2"].map((c) => (
              <span key={c} className={`absolute ${c} h-6 w-6 rounded-md border-primary-light/70`} />
            ))}

            {/* subtle grid */}
            <svg className="absolute inset-0 h-full w-full opacity-15" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#A78BDB" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            <div className="absolute left-4 top-4 z-10 font-serif text-base lowercase text-white/60">bloom</div>
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur">
              Pregnancy-Safe Squat
            </div>
            <button
              onClick={playVoice}
              className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-primary-dark shadow-bloom transition-transform hover:scale-105"
            >
              <Volume2 className="h-4 w-4" /> Voice Coach
            </button>

            {/* Center: Start screen OR pose skeleton */}
            {!started ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                  <Camera className="h-7 w-7 text-primary-light" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl">Motion Detection Zone</h2>
                  <p className="mt-1 max-w-xs text-xs text-white/60">
                    Stand inside the frame so your full body is visible. We'll start tracking when you press Begin.
                  </p>
                </div>
                <button
                  onClick={() => setStarted(true)}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-light px-7 py-3 text-sm font-semibold text-white shadow-bloom-lg transition-transform hover:scale-105"
                >
                  <Play className="h-4 w-4" fill="currentColor" /> Begin Workout
                </button>
                <p className="text-[10px] uppercase tracking-widest text-white/30">
                  MediaPipe pose tracking will mount here
                </p>
              </div>
            ) : (
              <>
                {/* Live pose skeleton */}
                <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
                  <defs>
                    <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <g stroke="#A78BDB" strokeWidth="3" strokeLinecap="round" opacity="0.9" filter="url(#glow)">
                    <line x1="200" y1="110" x2="200" y2="170" />
                    <line x1="160" y1="160" x2="240" y2="160" />
                    <line x1="160" y1="160" x2="140" y2="220" />
                    <line x1="140" y1="220" x2="155" y2="265" />
                    <line x1="240" y1="160" x2="260" y2="220" />
                    <line x1="260" y1="220" x2="245" y2="265" />
                    <line x1="200" y1="170" x2="200" y2="235" />
                    <line x1="175" y1="235" x2="225" y2="235" />
                    <line x1="175" y1="235" x2="155" y2="295" />
                    <line x1="155" y1="295" x2="170" y2="355" />
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

                {/* Floating coach cards appear as session progresses */}
                {elapsed > 4 && <FloatCard pos="left-4 top-20" emoji="💜" text="Great posture! Keep your chest open." />}
                {elapsed > 10 && <FloatCard pos="right-4 top-24" emoji="✓" text="Engage core gently." color="text-primary" />}
                {elapsed > 18 && <FloatCard pos="left-4 bottom-28" emoji="⭐" text="Stable & grounded." />}
                {elapsed > 25 && <FloatCard pos="right-4 bottom-32" emoji="✅" text="Knees aligned with toes." color="text-success" />}
              </>
            )}

            {/* Bottom: timer + reps + progress bar */}
            <div className="absolute bottom-0 left-0 right-0 z-10 space-y-2 bg-gradient-to-t from-black/70 to-transparent p-4">
              {started && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-white/70">
                    <span>Set {set} · {reps}/{TARGET_REPS_PER_SET} reps</span>
                    <span>{Math.round(setPct)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all" style={{ width: `${setPct}%` }} />
                  </div>
                  <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-white/40 transition-all" style={{ width: `${sessionPct}%` }} />
                  </div>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <Stat v={String(reps)} l="REPS" />
                <Stat v={`${set}/${TOTAL_SETS}`} l="SET" />
                <Stat v={`${mm}:${ss}`} l="⏱ TIME" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 text-foreground">
          <div className="card-bloom p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Live Feedback</h3>
              <Volume2 className="h-4 w-4 text-primary" />
            </div>
            {!started ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-xs text-muted-foreground">
                Feedback will appear once you start moving.
              </div>
            ) : (
              <>
                <ul className="mt-4 space-y-3 text-sm">
                  {elapsed > 4 && <FeedbackRow color="bg-success" label="Great posture" />}
                  {elapsed > 10 && <FeedbackRow color="bg-success" label="Knees aligned" />}
                  {elapsed > 18 && <FeedbackRow color="bg-warning" label="Engage core gently" />}
                  {elapsed > 25 && <FeedbackRow color="bg-success" label="Move at a comfortable pace" />}
                  {elapsed <= 4 && <li className="text-xs italic text-muted-foreground">Reading your form…</li>}
                </ul>
                <p className="mt-4 italic text-xs text-primary">"Listening to your body is the best guide."</p>
              </>
            )}
          </div>

          <div className="card-bloom p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">AI Coach</h3>
            </div>
            <div className="relative mt-3 rounded-2xl bg-primary-tint p-4 text-sm text-primary-dark">
              {started
                ? "You're moving beautifully today. Take it slow and listen to your body."
                : "Press Begin when you're ready — I'll guide you through every rep."}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Volume2 className="h-3 w-3" /> Voice Coach
            </div>
          </div>

          <div className="card-bloom p-5 text-center">
            <ConfidenceRing value={started ? Math.min(95, 60 + Math.floor(elapsed / 4)) : 0} />
            <p className="mt-3 text-xs text-muted-foreground">
              {started
                ? "You're building strength and confidence one step at a time. 💜"
                : "Your confidence score will appear once you start."}
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
            onClick={handleEnd}
            className="flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <X className="h-4 w-4" /> End Workout
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-white/10 px-3 py-2 text-center backdrop-blur">
      <div className="text-lg font-bold">{v}</div>
      <div className="text-[10px] text-white/60">{l}</div>
    </div>
  );
}

function FloatCard({ pos, emoji, text, color = "text-primary-dark" }: { pos: string; emoji: string; text: string; color?: string }) {
  return (
    <div className={`absolute ${pos} z-10 max-w-[200px] animate-fade-up rounded-2xl bg-white p-3 text-[11px] font-medium shadow-bloom ${color}`}>
      <span className="mr-1.5">{emoji}</span>{text}
    </div>
  );
}

function FeedbackRow({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex animate-fade-up items-center gap-3">
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
          strokeDasharray={c} strokeDashoffset={off} className="transition-all duration-500" />
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
