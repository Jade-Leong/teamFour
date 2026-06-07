import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Smile, Meh, Frown } from "lucide-react";

type Mood = "great" | "okay" | "tough";

const options: { id: Mood; label: string; sub: string; Icon: typeof Smile; color: string; bg: string }[] = [
  { id: "great", label: "Great", sub: "Energized & strong", Icon: Smile, color: "text-success", bg: "from-success/20 to-success/5" },
  { id: "okay", label: "Okay", sub: "Getting through it", Icon: Meh, color: "text-warning", bg: "from-warning/20 to-warning/5" },
  { id: "tough", label: "Tough", sub: "Today was hard", Icon: Frown, color: "text-primary", bg: "from-primary/20 to-primary/5" },
];

function Mood() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Mood | null>(null);

  const submit = () => {
    if (!selected) return;
    navigate("/results");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-5 py-8">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col animate-fade-up">
        <div className="text-center">
          <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Daily Check-in
          </div>
          <h1 className="mt-3 font-serif text-4xl text-foreground">
            How are you<br />feeling today?
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your honest answer helps Juno tailor tomorrow's session.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {options.map(({ id, label, sub, Icon, color, bg }) => {
            const active = selected === id;
            return (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`flex w-full items-center gap-5 rounded-3xl border-2 p-5 text-left transition-all ${
                  active
                    ? "border-primary bg-gradient-to-br from-primary-tint to-white shadow-bloom scale-[1.02]"
                    : "border-border bg-white hover:border-primary/40"
                }`}
              >
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${bg}`}>
                  <Icon className={`h-9 w-9 ${color}`} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-lg">{label}</div>
                  <div className="text-sm text-muted-foreground">{sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-10">
          <button
            onClick={submit}
            disabled={!selected}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue →
          </button>
          <button
            onClick={() => navigate("/results")}
            className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-primary"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}


export default Mood;
