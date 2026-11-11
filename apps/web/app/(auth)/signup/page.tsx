"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Building, Check, X, AlertCircle } from "lucide-react";
import { getApiBaseUrl } from "../../../lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [seedDemo, setSeedDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline password rules validation
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSymbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please satisfy all password security requirements");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          email,
          password,
          workspaceName: workspaceName || undefined,
          seedDemo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create account");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("mocklab_token", data.token);
        localStorage.setItem("mocklab_user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-8 shadow-xl space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold text-[var(--ink)]">Create your workspace</h1>
        <p className="text-xs text-[var(--ink-2)]">
          Instant API mocks with free 5,000 monthly requests
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-xs text-[var(--danger)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}



      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-medium text-[var(--ink)]">Your Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-medium text-[var(--ink)] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            <span>Work Email</span>
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
          <label className="font-medium text-[var(--ink)] flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            <span>Workspace Name</span>
          </label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Acme Engineering"
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-medium text-[var(--ink)] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            <span>Password</span>
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors"
          />

          {/* Inline Password Rules Checklist (§2.1 Screen 4) */}
          <div className="pt-2 space-y-1 text-[11px] text-[var(--ink-3)]">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-[var(--success)]" : ""}`}>
              {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? "text-[var(--success)]" : ""}`}>
              {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>At least one number (0-9)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasSymbol ? "text-[var(--success)]" : ""}`}>
              {hasSymbol ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>At least one special symbol (!@#$%^&amp;*)</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-md border border-[var(--border)] bg-[var(--surface-0)] flex items-start gap-2.5">
          <input
            type="checkbox"
            id="seedDemo"
            checked={seedDemo}
            onChange={(e) => setSeedDemo(e.target.checked)}
            className="mt-0.5 rounded border-[var(--border)] accent-[var(--signal)]"
          />
          <label htmlFor="seedDemo" className="text-[11px] text-[var(--ink-2)] select-none cursor-pointer">
            <strong className="text-[var(--ink)] block">Pre-load Petstore Demo Project</strong>
            Includes 8 operations, 3 sample rules, and contract test expectations.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 pt-2"
        >
          <span>{loading ? "Creating..." : "Create Account & Workspace"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="text-center text-xs text-[var(--ink-2)] pt-2 border-t border-[var(--border)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--signal)] font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
