import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-0)] text-[var(--ink)]">
      {/* Marketing Header */}
      <header className="h-16 px-8 border-b border-[var(--border)] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center bg-[var(--signal)] text-[var(--surface-0)] font-bold text-sm">
            ML
          </div>
          <span className="font-bold text-base tracking-tight text-[var(--ink)]">MockLab</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/docs" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
            Docs
          </Link>
          <Link href="/pricing" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
            Demo
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[var(--signal)] text-[var(--surface-0)] hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="h-16 px-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--ink-3)]">
        <div>© 2026 MockLab. API Mocking + Contract Testing.</div>
        <div className="flex items-center gap-4">
          <Link href="/docs" className="hover:text-[var(--ink)]">
            Documentation
          </Link>
          <Link href="/pricing" className="hover:text-[var(--ink)]">
            Pricing
          </Link>
          <Link href="https://github.com" className="hover:text-[var(--ink)]">
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
