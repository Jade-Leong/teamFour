import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useUserProfile } from "@/context/UserProfileContext";

function Profile() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const initial = (profile.firstName || "?").charAt(0).toUpperCase();
  const experienceLabel = profile.experience
    ? {
        after_loss: "Pregnant after loss",
        first: "First-time pregnancy",
        high_anxiety: "High-anxiety pregnancy",
        general: "General pregnancy",
      }[profile.experience]
    : "Personalize your journey";
  const subline =
    profile.pregnancyStatus === "postpartum"
      ? `Postpartum · ${experienceLabel}`
      : profile.weeksPregnant
      ? `${profile.weeksPregnant} weeks pregnant · ${experienceLabel}`
      : experienceLabel;

  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="mx-auto max-w-md space-y-5 px-6 pt-8 animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-light p-6 text-white shadow-bloom-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 font-serif text-3xl backdrop-blur">{initial}</div>
            <div className="flex-1">
              <div className="font-serif text-2xl">{profile.firstName}</div>
              <div className="text-xs opacity-90">{subline}</div>
            </div>
            <button className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-primary">Edit Profile</button>
          </div>
        </div>

        <div className="card-bloom divide-y divide-border overflow-hidden">
          <Row label="My Plan" />
          <Row label="Pregnancy Settings" />
          <Row label="Workout Reminders" />
          <Row label="Voice Coach" value="Calm Female" />
          <Row label="Help & Support" />
          <Row label="About Juno" />
        </div>

        <button onClick={() => navigate("/")} className="w-full py-4 text-sm font-semibold text-destructive hover:underline">
          Log Out
        </button>

        <p className="text-center text-[11px] italic text-muted-foreground">
          Juno is not a substitute for medical advice. Always follow your doctor's recommendations.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <button className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-primary-tint/40">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {value}
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}


export default Profile;
