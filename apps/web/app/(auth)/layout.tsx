import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[var(--surface-0)] text-[var(--ink)]">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded flex items-center justify-center bg-[var(--signal)] text-[var(--surface-0)] font-bold text-sm">
            ML
          </div>
          <span className="font-bold text-xl tracking-tight text-[var(--ink)]">MockLab</span>
        </Link>
        <span className="text-xs text-[var(--ink-3)] font-mono">
          API Mocking + Contract Testing
        </span>
      </div>

      {/* Card Shell */}
      <div className="w-full max-w-md">{children}</div>

      {/* Footer */}
      <div className="mt-8 text-xs text-[var(--ink-3)] flex items-center gap-4">
        <Link href="/terms" className="hover:text-[var(--ink)] transition-colors">
          Terms
        </Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-[var(--ink)] transition-colors">
          Privacy
        </Link>
        <span>·</span>
        <Link href="/docs" className="hover:text-[var(--ink)] transition-colors">
          Documentation
        </Link>
      </div>
    </div>
  );
}
