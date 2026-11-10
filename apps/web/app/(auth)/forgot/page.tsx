"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-8 shadow-xl space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold text-[var(--ink)]">Reset password</h1>
        <p className="text-xs text-[var(--ink-2)]">
          Enter your email to receive recovery instructions
        </p>
      </div>

      {submitted ? (
        <div className="p-4 rounded-md bg-[var(--success)]/10 border border-[var(--success)]/30 text-xs text-[var(--ink)] space-y-2 text-center">
          <CheckCircle2 className="w-6 h-6 text-[var(--success)] mx-auto" />
          <h2 className="font-semibold text-sm">Check your inbox</h2>
          <p className="text-[var(--ink-2)]">
            If an account exists for <span className="font-mono text-[var(--signal)]">{email}</span>, we have
            sent password reset instructions.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--signal)] font-medium hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      ) : (
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

          <button
            type="submit"
            className="w-full py-2.5 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span>Send Reset Instructions</span>
          </button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
