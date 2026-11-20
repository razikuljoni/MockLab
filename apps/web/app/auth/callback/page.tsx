"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userJson = searchParams.get("user");

    if (token) {
      localStorage.setItem("mocklab_token", token);
      if (userJson) {
        try {
          localStorage.setItem("mocklab_user", userJson);
        } catch {
          // ignore parsing error
        }
      }
      router.replace("/dashboard");
    } else {
      router.replace("/login?error=github_auth_failed");
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--surface-0)] text-[var(--ink)]">
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-xs font-mono text-[var(--ink-2)] shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
        <span>Completing GitHub authentication...</span>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
