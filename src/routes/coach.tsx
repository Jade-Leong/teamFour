import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles, Heart } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/coach")({
  head: () => ({ meta: [{ title: "AI Coach · bloom" }] }),
  component: Coach,
});

type Msg = { role: "user" | "ai"; text: string };

function Coach() {
  const [messages] = useState<Msg[]>([
    { role: "user", text: "Is it safe to do squats every day?" },
    { role: "ai", text: "In general, bodyweight squats are safe for most days during pregnancy if you feel well and have no medical restrictions. Listen to your body and rest when you need to." },
    { role: "ai", text: "I'm here to help you adjust if anything doesn't feel right. 💜" },
    { role: "user", text: "Thank you! 🙏" },
  ]);
  const [input, setInput] = useState("");

  return (
    <div className="flex min-h-screen flex-col bg-background pb-36">
      <header className="flex items-center justify-between border-b border-border bg-white/80 px-6 py-4 backdrop-blur">
        <h1 className="font-serif text-2xl text-foreground">AI Coach</h1>
        <Heart className="h-5 w-5 text-primary" fill="currentColor" />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`} style={{ animationDelay: `${i * 80}ms` }}>
            {m.role === "ai" ? (
              <div className="max-w-[80%]">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3 w-3" /> AI Coach
                </div>
                <div className="card-bloom rounded-3xl rounded-tl-md p-4 text-sm text-foreground">{m.text}</div>
              </div>
            ) : (
              <div className="max-w-[75%] rounded-3xl rounded-tr-md bg-gradient-to-br from-primary to-primary-light px-4 py-3 text-sm text-white shadow-bloom">
                {m.text}
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-1.5 px-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0s" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0.15s" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0.3s" }} />
        </div>
      </main>

      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything…"
            className="input-bloom rounded-full"
          />
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-white shadow-bloom hover:scale-105">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-md text-center text-[10px] italic text-muted-foreground">
          Bloom AI is not a substitute for medical advice. Always follow your doctor's recommendations.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
