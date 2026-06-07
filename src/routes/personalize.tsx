import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/personalize")({
  head: () => ({ meta: [{ title: "Personalize · Juno" }] }),
  component: Personalize,
});

function Personalize() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-5 py-6">
      <div className="w-full max-w-md flex-1 flex flex-col">
        <div className="relative overflow-hidden rounded-[2rem] shadow-bloom-lg flex-1 min-h-[560px] flex flex-col justify-between p-6 bg-gradient-to-br from-[#E8DEFF] via-[#F2E8FF] to-[#FFE8F0]">
          <img
            src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80"
            alt="Pregnant woman in calm pose"
            className="absolute inset-0 h-full w-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

          <div className="relative z-10">
            <Logo />
          </div>

          <div className="relative z-10 space-y-6">
            <h1 className="text-white text-4xl leading-[1.1] font-bold tracking-tight">
              Let's personalize<br />your experience.
            </h1>
            <p className="text-white/90 text-sm leading-relaxed max-w-xs">
              This helps us provide workouts and guidance that are right for you.
            </p>

            <Link
              to="/onboarding"
              className="block w-full rounded-full bg-primary text-primary-foreground text-center py-4 font-semibold text-base shadow-bloom-lg hover:opacity-95 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Takes less than a minute · Private & secure
        </div>
      </div>
    </div>
  );
}
