import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Juno — Move safely. Feel confident." },
      { name: "description", content: "AI-powered prenatal fitness coaching for every stage of your journey." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-5 py-6">
      <div className="w-full max-w-md flex-1 flex flex-col">
        {/* Hero photo card */}
        <div className="relative overflow-hidden rounded-[2rem] shadow-bloom-lg flex-1 min-h-[560px] flex flex-col justify-between p-6 bg-gradient-to-br from-[#E8DEFF] via-[#F2E8FF] to-[#FFE8F0]">
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80"
            alt="Pregnant woman in calm pose"
            className="absolute inset-0 h-full w-full object-cover opacity-95"
          />
          {/* Bottom gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Logo top */}
          <div className="relative z-10">
            <Logo />
          </div>

          {/* Heading + CTA bottom */}
          <div className="relative z-10 space-y-6">
            <h1 className="text-white text-4xl leading-[1.1] font-bold tracking-tight whitespace-pre-line">
              Safe movement.{"\n"}
              Stronger you.{"\n"}
              Confident tomorrow.
            </h1>
            <p className="text-white/90 text-sm leading-relaxed max-w-xs">
              AI-powered exercise coaching for every step of your pregnancy or postpartum journey.
            </p>

            <Link
              to="/signup"
              className="block w-full rounded-full bg-primary text-primary-foreground text-center py-4 font-semibold text-base shadow-bloom-lg hover:opacity-95 transition-opacity"
            >
              Get Started
            </Link>

            <Link
              to="/login"
              className="block text-center text-white/95 text-sm font-medium underline-offset-4 hover:underline"
            >
              I already have an account
            </Link>
          </div>
        </div>

        {/* Footer trust line */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Doctor-aware · Trauma-informed · Built with care
        </div>
      </div>
    </div>
  );
}
