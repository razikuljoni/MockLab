import Link from "next/link";
import { Terminal, Star, ArrowRight } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-0)] text-[var(--ink)] antialiased selection:bg-[var(--signal)] selection:text-[var(--surface-0)]">
      {/* Stitch 1:1 Header */}
      <header className="sticky top-0 left-0 right-0 z-50 h-14 bg-[var(--surface-0)]/90 backdrop-blur-md border-b border-[var(--border)] shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
        <div className="h-14 max-w-7xl mx-auto px-6 flex items-center justify-between gap-3">
          {/* Left Brand + Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded flex items-center justify-center bg-[var(--signal)] text-[var(--surface-0)] font-bold font-mono text-xs shadow-[0_0_15px_rgba(183,246,51,0.3)] group-hover:scale-105 transition-transform">
                <Terminal className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-display font-semibold text-base tracking-tight text-[var(--ink)]">
                MockLab
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--signal)] font-mono text-[10px] font-semibold border border-[var(--border)]">
                v2.4
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-2 text-xs">
              <Link
                href="/"
                className="text-[var(--ink)] font-semibold bg-[var(--surface-2)] px-2.5 py-1 rounded transition-colors"
              >
                Landing
              </Link>
              <Link
                href="/dashboard"
                className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors px-2.5 py-1"
              >
                Dashboard
              </Link>
              <Link
                href="/projects/petstore/playground"
                className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors px-2.5 py-1"
              >
                Playground
              </Link>
              <Link
                href="/projects/petstore/endpoints/users/rules"
                className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors px-2.5 py-1"
              >
                Rules
              </Link>
              <Link
                href="/projects/petstore/logs"
                className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors px-2.5 py-1"
              >
                Logs
              </Link>
              <Link
                href="/projects/petstore/contracts"
                className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors px-2.5 py-1"
              >
                Contracts
              </Link>
              <Link
                href="/docs"
                className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors px-2.5 py-1"
              >
                Docs
              </Link>
              <Link
                href="/pricing"
                className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors px-2.5 py-1"
              >
                Pricing
              </Link>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="hidden sm:inline-block text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors px-1"
            >
              Docs
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--surface-1)] font-mono text-[11px] text-[var(--ink-2)] border border-[var(--border)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] animate-pulse" />
              <span>Status: 99.99%</span>
            </div>

            <Link
              href="https://github.com/razikuljoni/MockLab"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--surface-2)] font-mono text-[11px] text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--border)] transition-colors"
            >
              <Star className="w-3 h-3 text-[var(--signal)] fill-[var(--signal)]" />
              <span>4.2k ★</span>
            </Link>

            <Link
              href="/login"
              className="px-3 py-1.5 rounded text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-1)] transition-colors"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="h-8 px-3.5 rounded bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(183,246,51,0.25)]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 bg-[var(--surface-0)]">{children}</main>

      {/* Stitch 1:1 Fast Navigation & System Status Section */}
      <section className="w-full py-10 px-6 lg:px-12 bg-[var(--surface-3)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-[var(--ink-2)]">
            <Link href="/docs" className="hover:text-[var(--signal)] transition-colors">
              Documentation
            </Link>
            <Link href="/docs" className="hover:text-[var(--signal)] transition-colors">
              CLI Reference
            </Link>
            <Link
              href="https://github.com/razikuljoni/MockLab"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--signal)] transition-colors"
            >
              GitHub Repository
            </Link>
            <Link href="/pricing" className="hover:text-[var(--signal)] transition-colors">
              Discord Community
            </Link>
            <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--signal)] transition-colors">
              Twitter / X
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--surface-1)] font-mono text-xs text-[var(--ink-2)] border border-[var(--border)]">
              <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
              <span>All MockLab Systems Operational</span>
            </div>
            <span className="text-[var(--ink-3)] font-mono text-xs hidden sm:inline">
              Region: Global Anycast
            </span>
          </div>
        </div>
      </section>

      {/* Stitch 1:1 Global Footer */}
      <footer className="w-full bg-[var(--surface-3)] py-8 border-t border-[var(--border)] shadow-[0_-1px_12px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--ink-2)]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-[var(--signal)] text-[var(--surface-0)] font-bold font-mono text-[10px]">
              <Terminal className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="font-display font-semibold text-sm text-[var(--ink)]">
              MockLab
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-3)] ml-2">
              Precision Contract Virtualization
            </span>
          </div>

          <p className="text-[11px] text-[var(--ink-3)]">
            © 2026 MockLab Systems Inc. Engineered for mission-critical API topologies.
          </p>
        </div>
      </footer>
    </div>
  );
}
