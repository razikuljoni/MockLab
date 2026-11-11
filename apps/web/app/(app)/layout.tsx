"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "../../components/sidebar";
import { TopBar } from "../../components/top-bar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for stored JWT session token
    const token = localStorage.getItem("mocklab_token");
    if (!token) {
      setIsAuthenticated(false);
      const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
      router.replace(redirectUrl);
    } else {
      setIsAuthenticated(true);
    }
  }, [router, pathname]);

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--surface-0)] text-[var(--ink)]">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-xs font-mono text-[var(--ink-2)] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
          <span>Verifying authentication session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface-0)] text-[var(--ink)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
