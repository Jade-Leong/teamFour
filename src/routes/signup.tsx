import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useUserProfile } from "@/context/UserProfileContext";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account · bloom" }] }),
  component: Signup,
});

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.73.13-1.43.36-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

function Signup() {
  const navigate = useNavigate();
  const { updateProfile } = useUserProfile();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const handleSubmit = () => {
    const firstName = fullName.trim().split(/\s+/)[0] || "Friend";
    updateProfile({ firstName, email, username });
    navigate({ to: "/personalize" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
      <Logo />
      <div className="card-bloom mt-8 w-full max-w-md p-8 animate-fade-up">
        <h2 className="font-serif text-3xl text-foreground">Create your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your personalized pregnancy fitness journey
        </p>

        <div className="mt-6 space-y-4">
          <Field label="Full Name">
            <input className="input-bloom" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Emma Rivera" />
          </Field>
          <Field label="Email">
            <input className="input-bloom" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="emma@example.com" />
          </Field>
          <Field label="Username">
            <input className="input-bloom" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="emma" />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input className="input-bloom pr-12" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <button onClick={handleSubmit} className="btn-primary w-full hover:opacity-95">
            Create Account →
          </button>

          <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white py-3 text-sm font-semibold text-foreground hover:bg-secondary">
            <GoogleIcon /> Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
