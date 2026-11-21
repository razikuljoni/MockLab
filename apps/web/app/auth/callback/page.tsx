"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Read token and user from URL hash fragment (preferred for privacy) or search query parameters
    let token: string | null = null;
    let userJson: string | null = null;

    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      token = hashParams.get("token");
      userJson = hashParams.get("user");
    }

    if (!token) {
      token = searchParams.get("token");
      userJson = searchParams.get("user");
    }

    if (token) {
      localStorage.setItem("mocklab_token", token);
      if (userJson) {
        try {
          localStorage.setItem("mocklab_user", userJson);
        } catch {
          // ignore parsing error
        }
      }
      // Clean address bar immediately so credentials do not persist in browser history
      if (typeof window !== "undefined") {
        window.history.replaceState(null, document.title, window.location.pathname);
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
