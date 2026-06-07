import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Dumbbell, BarChart3, Bot, User } from "lucide-react";

const tabs = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/workouts", label: "Workouts", Icon: Dumbbell },
  { to: "/progress", label: "Progress", Icon: BarChart3 },
  { to: "/coach", label: "Coach", Icon: Bot },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {tabs.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors"
            >
              <Icon
                className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[11px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                {label}
              </span>
              <span
                className={`h-1 w-1 rounded-full transition-all ${active ? "bg-primary" : "bg-transparent"}`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
