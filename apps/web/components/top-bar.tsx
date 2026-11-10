"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Search } from "lucide-react";
import { useState, useEffect } from "react";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [envMode, setEnvMode] = useState<"mock" | "real">("mock");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-14 px-6 border-b border-[var(--border)] bg-[var(--surface-1)] flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--ink-3)]">Project /</span>
          <span className="font-medium text-[var(--ink)]">Petstore Demo</span>
        </div>

        {/* Mock / Real switcher (§6.2) */}
        <div className="flex items-center bg-[var(--surface-0)] border border-[var(--border)] rounded-md p-0.5 text-xs">
          <button
            onClick={() => setEnvMode("mock")}
            className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
              envMode === "mock"
                ? "bg-[var(--signal)] text-[var(--surface-0)]"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            Mock
          </button>
          <button
            onClick={() => setEnvMode("real")}
            className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
              envMode === "real"
                ? "bg-[var(--signal)] text-[var(--surface-0)]"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            Real
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Cmd+K search hint */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-xs text-[var(--ink-3)] hover:border-[var(--border-strong)] transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>Search or jump to...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--border)]">
            ⌘K
          </kbd>
        </button>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--ink)]">
          JD
        </div>
      </div>
    </header>
  );
}
