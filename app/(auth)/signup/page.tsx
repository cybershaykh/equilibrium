"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Scale, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.register(name, email, password);
      toast.success("Account created — set your north star.");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white">
          <Scale size={24} />
        </div>
        <h1 className="accent-font text-3xl font-bold text-ink">Join Equilibrium</h1>
        <p className="text-sm text-stone-500">Accountability is renewable. Turn intention into action.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input
            id="name"
            required
            className="input"
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-name"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="input-email"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            className="input"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="input-password"
          />
        </div>
        <button type="submit" disabled={loading} data-testid="btn-submit" className="btn-primary mt-1">
          {loading ? "Creating…" : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    </div>
  );
}