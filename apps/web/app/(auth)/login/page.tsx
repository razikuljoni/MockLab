"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Github, Lock, Mail, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to sign in");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("mocklab_token", data.token);
        localStorage.setItem("mocklab_user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-8 shadow-xl space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold text-[var(--ink)]">Welcome back</h1>
        <p className="text-xs text-[var(--ink-2)]">
          Sign in to your MockLab workspace
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-xs text-[var(--danger)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* GitHub OAuth Button */}
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="w-full py-2.5 px-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] text-xs font-medium hover:bg-[var(--surface-0)] transition-colors flex items-center justify-center gap-2"
      >
        <Github className="w-4 h-4" />
        <span>Continue with GitHub</span>
      </button>

      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-[var(--border)]"></span>
        <span className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider font-mono">
          or with email
        </span>
        <span className="flex-1 h-px bg-[var(--border)]"></span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-medium text-[var(--ink)] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            <span>Email address</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@company.com"
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-medium text-[var(--ink)] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[var(--ink-3)]" />
              <span>Password</span>
            </label>
            <Link
              href="/forgot"
              className="text-[11px] text-[var(--signal)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-[var(--border)] accent-[var(--signal)]"
          />
          <label htmlFor="remember" className="text-[11px] text-[var(--ink-2)] select-none cursor-pointer">
            Remember me for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 pt-2"
        >
          <span>{loading ? "Signing in..." : "Sign in"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="text-center text-xs text-[var(--ink-2)] pt-2 border-t border-[var(--border)]">
        Don't have an account?{" "}
        <Link href="/signup" className="text-[var(--signal)] font-medium hover:underline">
          Create workspace
        </Link>
      </div>
    </div>
  );
}
