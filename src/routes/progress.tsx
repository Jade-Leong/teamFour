import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";
import { ChevronDown, Flame } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress · bloom" }] }),
  component: Progress,
});

const data = [
  { day: "M", mins: 20 },
  { day: "T", mins: 0 },
  { day: "W", mins: 25 },
  { day: "T", mins: 15 },
  { day: "F", mins: 25 },
  { day: "S", mins: 0 },
  { day: "S", mins: 0 },
];

function Progress() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="flex items-center justify-between px-6 pt-6">
        <h1 className="font-serif text-4xl">Progress</h1>
        <button className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-bloom">
          This Week <ChevronDown className="h-3 w-3" />
        </button>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-6 pt-6 animate-fade-up">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Workouts" value="3" sub="/ 5 completed" />
          <StatCard label="Minutes Active" value="85" sub="/ 150 min" bar={85/150} />
          <StatCard label="Streak" value="2" sub="days" icon={<Flame className="h-4 w-4 text-warning" />} />
          <StatCard label="Confidence" value="82%" sub="💜" />
        </div>

        <div className="card-bloom p-5">
          <h3 className="font-semibold text-foreground">Activity This Week</h3>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis hide />
                <Bar dataKey="mins" radius={[8, 8, 0, 0]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.mins > 0 ? "#7C5CBF" : "#EDE6F8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-bloom flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 text-2xl">🔥</div>
          <div>
            <div className="font-semibold text-foreground">3 days in a row</div>
            <div className="text-xs text-muted-foreground">Keep it up — consistency matters more than intensity.</div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({ label, value, sub, bar, icon }: { label: string; value: string; sub?: string; bar?: number; icon?: React.ReactNode }) {
  return (
    <div className="card-bloom p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-serif text-3xl text-primary-dark">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      {bar !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-tint">
          <div className="h-full bg-gradient-to-r from-primary to-primary-light" style={{ width: `${Math.min(100, bar * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
