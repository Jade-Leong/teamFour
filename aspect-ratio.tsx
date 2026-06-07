import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-tint">
        <Heart className="h-4 w-4 text-primary" fill="currentColor" />
      </span>
      <span className="font-serif text-2xl lowercase text-primary-dark">juno</span>
    </Link>
  );
}
