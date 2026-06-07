import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/building")({
  head: () => ({ meta: [{ title: "Building your workout · Juno" }] }),
  component: Building,
});

const STEPS = [
  "Analyzing your profile",
  "Selecting safe movements",
  "Tailoring intensity",
  "Finalizing your plan",
];

function Building() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 3200;
    const tick = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(p);
      setStepIdx(Math.min(STEPS.length - 1, Math.floor((p / 100) * STEPS.length)));
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(() => navigate({ to: "/dashboard" }), 350);
      }
    }, 60);
    return () => clearInterval(tick);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <Logo />

        <div className="mt-12 relative h-32 w-32">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-tint to-primary-light/40 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-4xl shadow-bloom-lg">
            🌸
          </div>
          <div className="absolute -inset-3 rounded-full border-2 border-primary/30 animate-ping" />
        </div>

        <h1 className="mt-10 font-serif text-3xl text-foreground">
          Building your personal workout
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xs">
          Hold tight — we're tailoring everything to your stage, comfort, and goals.
        </p>

        <div className="mt-8 w-full">
          <div className="h-2 overflow-hidden rounded-full bg-primary-tint">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-light transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 text-xs font-semibold text-primary">
            {STEPS[stepIdx]}…
          </div>
        </div>
      </div>
    </div>
  );
}
