"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Search, LogOut, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/navigation";
import { useRouter } from "next/navigation";

export function TopBar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [envMode, setEnvMode] = useState<"mock" | "real">("mock");
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("mocklab_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse error
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
        setDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("mocklab_token");
    localStorage.removeItem("mocklab_user");
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "ML";

  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", desc: "Overview of projects and status" },
    { label: "Projects", href: "/projects", desc: "Manage workspaces and projects" },
    { label: "Rules Editor", href: "/projects/petstore/rules", desc: "Configure mock responses and templates" },
    { label: "API Playground", href: "/projects/petstore/playground", desc: "Test mock endpoints interactively" },
    { label: "Traffic Inspector", href: "/projects/petstore/logs", desc: "Live request history and inspect payloads" },
    { label: "Contract Tests", href: "/projects/petstore/contracts", desc: "OpenAPI schema compliance checks" },
    { label: "Settings", href: "/settings", desc: "Workspace configuration" },
    { label: "Billing", href: "/billing", desc: "Plan limits and subscriptions" },
    { label: "Account Profile", href: "/account", desc: "User settings and password" },
  ];

  const filteredItems = navigationItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="h-14 px-6 border-b border-[var(--border)] bg-[var(--surface-1)] flex items-center justify-between relative">
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
        {/* Cmd+K search button */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-xs text-[var(--ink-3)] hover:border-[var(--border-strong)] hover:text-[var(--ink)] transition-colors"
        >
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

        {/* User avatar and dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="User account menu"
            className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--signal)] flex items-center justify-center text-xs font-semibold text-[var(--ink)] transition-colors"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] shadow-xl p-2 z-50 text-xs space-y-1">
              <div className="px-3 py-2 border-b border-[var(--border)]">
                <p className="font-semibold text-[var(--ink)] truncate">{user?.name || "MockLab User"}</p>
                <p className="text-[11px] text-[var(--ink-3)] truncate">{user?.email || "Signed in"}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/account");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)] text-left"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account Profile</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--danger)]/10 text-[var(--danger)] text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ⌘K Command Palette Modal */}
      {paletteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-24 z-50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center px-4 border-b border-[var(--border)]">
              <Search className="w-4 h-4 text-[var(--ink-3)] shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search navigation or commands..."
                className="w-full px-3 py-3 text-xs bg-transparent text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none"
              />
              <button
                onClick={() => setPaletteOpen(false)}
                className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filteredItems.length === 0 ? (
                <p className="text-center py-6 text-xs text-[var(--ink-3)]">No matching results found</p>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      setPaletteOpen(false);
                      router.push(item.href);
                    }}
                    className="w-full flex flex-col text-left px-3 py-2 rounded-md hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <span className="text-xs font-medium text-[var(--ink)]">{item.label}</span>
                    <span className="text-[11px] text-[var(--ink-3)]">{item.desc}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
