import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useUserProfile, type Experience, type FitnessLevel, type PregnancyStatus, type Trimester } from "@/context/UserProfileContext";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Personalize · Juno" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useUserProfile();
  const [step, setStep] = useState(1);

  const steps = useMemo(() => {
    return profile.pregnancyStatus === "postpartum" ? [1, 2, 4, 5] : [1, 2, 3, 4, 5];
  }, [profile.pregnancyStatus]);
  const stepIndex = steps.indexOf(step);
  const totalSteps = steps.length;

  const canContinue = (): boolean => {
    if (step === 1) return !!profile.pregnancyStatus;
    if (step === 2) return !!profile.experience;
    if (step === 3) return !!profile.trimester;
    if (step === 4) return !!profile.fitnessLevel;
    if (step === 5) return profile.doctorCleared !== null;
    return false;
  };

  const next = () => {
    if (step === 5) { navigate({ to: "/building" }); return; }
    const i = steps.indexOf(step);
    setStep(steps[i + 1]);
  };
  const back = () => {
    const i = steps.indexOf(step);
    if (i > 0) setStep(steps[i - 1]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-primary-tint">
            <div className="h-full bg-gradient-to-r from-primary to-primary-light transition-all" style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }} />
          </div>
          Step {stepIndex + 1} of {totalSteps}
        </div>
      </header>

      <main className="flex-1 px-6 pb-32">
        <div className="mx-auto max-w-md">
          {stepIndex > 0 && (
            <button onClick={back} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}

          <div key={step} className="animate-fade-up">
            {step === 1 && <Step1 value={profile.pregnancyStatus} onChange={(v) => updateProfile({ pregnancyStatus: v })} />}
            {step === 2 && <Step2 value={profile.experience} onChange={(v) => updateProfile({ experience: v })} />}
            {step === 3 && <Step3 value={profile.trimester} onChange={(v) => updateProfile({ trimester: v })} />}
            {step === 4 && <Step4 value={profile.fitnessLevel} onChange={(v) => updateProfile({ fitnessLevel: v })} />}
            {step === 5 && <Step5 value={profile.doctorCleared} onChange={(v) => updateProfile({ doctorCleared: v })} />}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-white/95 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <button
            onClick={next}
            disabled={!canContinue()}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === 5 ? "Build Your Workout →" : "Continue →"}
          </button>
          <p className="text-center text-[11px] italic text-muted-foreground">
            Juno is not a substitute for medical advice. Always follow your doctor's recommendations.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-4xl text-foreground">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Step1({ value, onChange }: { value: PregnancyStatus; onChange: (v: PregnancyStatus) => void }) {
  return (
    <>
      <Heading title="I am currently" />
      <div className="grid grid-cols-2 gap-4">
        {(["pregnant", "postpartum"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`rounded-2xl border-2 p-6 text-center font-semibold capitalize transition-all ${
              value === v ? "border-primary bg-gradient-to-br from-primary to-primary-light text-white shadow-bloom" : "border-border bg-white text-foreground hover:border-primary/40"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </>
  );
}

const experienceOptions: { id: Experience; emoji: string; title: string; sub: string }[] = [
  { id: "after_loss", emoji: "🤍", title: "Pregnant after loss", sub: "Our coaching adapts with extra care and reassurance" },
  { id: "first", emoji: "✨", title: "First-time pregnancy", sub: "We'll guide you through every step" },
  { id: "high_anxiety", emoji: "💜", title: "High-anxiety pregnancy", sub: "We prioritize calm, confidence-building movement" },
  { id: "general", emoji: "🌿", title: "General pregnancy", sub: "Standard personalized prenatal fitness" },
];

function Step2({ value, onChange }: { value: Experience; onChange: (v: Experience) => void }) {
  return (
    <>
      <Heading title="My experience" subtitle="This helps us personalize your guidance and coaching tone" />
      <div className="space-y-3">
        {experienceOptions.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
              value === o.id ? "border-primary bg-primary-tint" : "border-border bg-white hover:border-primary/40"
            }`}
          >
            <span className="text-2xl">{o.emoji}</span>
            <div>
              <div className="font-semibold text-foreground">{o.title}</div>
              <div className="text-sm text-muted-foreground">{o.sub}</div>
            </div>
          </button>
        ))}
      </div>
      {value === "after_loss" && (
        <div className="mt-6 animate-fade-up rounded-2xl bg-gradient-to-br from-[#FBE9F0] to-[#F0EBFA] p-5">
          <p className="text-sm leading-relaxed text-primary-dark">
            We understand. Our language and coaching are specifically adapted for you.{" "}
            <span className="font-semibold">You're brave for being here.</span> 🤍
          </p>
        </div>
      )}
    </>
  );
}

function Step3({ value, onChange }: { value: Trimester; onChange: (v: Trimester) => void }) {
  const weeks: Record<NonNullable<Trimester>, number> = { "1st": 8, "2nd": 18, "3rd": 32 };
  const { updateProfile } = useUserProfile();
  return (
    <>
      <Heading title="I am in" />
      <div className="grid grid-cols-3 gap-3">
        {(["1st", "2nd", "3rd"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { onChange(t); updateProfile({ weeksPregnant: weeks[t] }); }}
            className={`rounded-full border-2 px-3 py-4 text-sm font-semibold transition-all ${
              value === t ? "border-primary bg-gradient-to-br from-primary to-primary-light text-white" : "border-border bg-white text-foreground hover:border-primary/40"
            }`}
          >
            {t} Trimester
          </button>
        ))}
      </div>
    </>
  );
}

const fitnessOptions: { id: FitnessLevel; title: string; sub: string }[] = [
  { id: "beginner", title: "Beginner", sub: "New to exercise or returning after a break" },
  { id: "moderate", title: "Moderate", sub: "I exercise occasionally" },
  { id: "active", title: "Active", sub: "Regular exercise is part of my routine" },
];

function Step4({ value, onChange }: { value: FitnessLevel; onChange: (v: FitnessLevel) => void }) {
  return (
    <>
      <Heading title="My current fitness level" />
      <div className="grid gap-3 md:grid-cols-3">
        {fitnessOptions.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              value === o.id ? "border-primary bg-primary-tint" : "border-border bg-white hover:border-primary/40"
            }`}
          >
            <div className="font-semibold text-foreground">{o.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{o.sub}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function Step5({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <>
      <Heading title="Has your doctor cleared you for exercise?" subtitle="This helps us determine what's appropriate for you today" />
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => onChange(true)}
          className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-5 font-semibold transition-all ${
            value === true ? "border-primary bg-gradient-to-br from-primary to-primary-light text-white" : "border-border bg-white text-foreground hover:border-primary/40"
          }`}
        >
          <Check className="h-4 w-4" /> Yes, I'm cleared
        </button>
        <button
          onClick={() => onChange(false)}
          className={`rounded-2xl border-2 p-5 font-semibold transition-all ${
            value === false ? "border-primary bg-primary-tint text-primary-dark" : "border-border bg-white text-foreground hover:border-primary/40"
          }`}
        >
          Not yet / Unsure
        </button>
      </div>
      {value === false && (
        <div className="mt-6 animate-fade-up rounded-2xl bg-[#FFF4E5] p-5">
          <p className="text-sm text-[#8a5a00]">
            No problem. We'll start with gentle breathing and education only until you've had that conversation.
          </p>
        </div>
      )}
    </>
  );
}
