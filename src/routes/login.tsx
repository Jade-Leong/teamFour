import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in · Juno" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
      <Logo />
      <div className="card-bloom mt-8 w-full max-w-md p-8 animate-fade-up">
        <h2 className="font-serif text-3xl">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">Good to see you again 💜</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
            <input className="input-bloom" type="email" placeholder="emma@example.com" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</span>
            <div className="relative">
              <input className="input-bloom pr-12" type={show ? "text" : "password"} placeholder="••••••••" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <div className="flex justify-end">
            <button className="text-xs font-semibold text-primary hover:underline">Forgot password?</button>
          </div>

          <button onClick={() => navigate({ to: "/dashboard" })} className="btn-primary w-full hover:opacity-95">
            Log In →
          </button>

          <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /><span>or</span><div className="h-px flex-1 bg-border" />
          </div>
          <button className="w-full rounded-full border border-border bg-white py-3 text-sm font-semibold hover:bg-secondary">
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
