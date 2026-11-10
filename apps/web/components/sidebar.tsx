"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  ListTree,
  Terminal,
  Sliders,
  Workflow,
  Activity,
  FileCheck2,
  CalendarClock,
  GitBranch,
  UploadCloud,
  BookOpen,
  CreditCard,
  Users,
  KeyRound,
  Receipt,
  Settings,
  User,
} from "lucide-react";

interface SidebarProps {
  projectId?: string;
}

export function Sidebar({ projectId = "petstore" }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderGit2 },
    { name: "Endpoints", href: `/projects/${projectId}/endpoints`, icon: ListTree },
    { name: "Playground", href: `/projects/${projectId}/playground`, icon: Terminal },
    { name: "Rules", href: `/projects/${projectId}/endpoints/users/rules`, icon: Sliders },
    { name: "Scenarios", href: `/projects/${projectId}/scenarios`, icon: Workflow },
    { name: "Traffic", href: `/projects/${projectId}/logs`, icon: Activity },
    { name: "Contracts", href: `/projects/${projectId}/contracts`, icon: FileCheck2 },
    { name: "Schedules", href: `/projects/${projectId}/contracts/schedules`, icon: CalendarClock },
    { name: "CI / CD", href: `/projects/${projectId}/ci`, icon: GitBranch },
    { name: "Import Spec", href: `/projects/${projectId}/import`, icon: UploadCloud },
    { name: "Docs", href: "/docs", icon: BookOpen },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
    { name: "Team", href: "/workspace/team", icon: Users },
    { name: "API Keys", href: "/workspace/keys", icon: KeyRound },
    { name: "Billing", href: "/workspace/billing", icon: Receipt },
    { name: "Settings", href: "/workspace/settings", icon: Settings },
    { name: "Account", href: "/account", icon: User },
  ];

  return (
    <aside className="w-60 min-w-60 h-screen flex flex-col border-r border-[var(--border)] bg-[var(--surface-1)]">
      {/* Brand & Workspace Switcher */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-[var(--signal)] text-[var(--surface-0)] font-bold text-xs">
            ML
          </div>
          <span className="font-semibold text-sm tracking-tight text-[var(--ink)]">MockLab</span>
        </Link>
        <div className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--ink-3)] font-mono">
          dev
        </div>
      </div>

      {/* 18-link navigation scroll area */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                isActive
                  ? "bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                  : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User status */}
      <div className="p-3 border-t border-[var(--border)] text-xs text-[var(--ink-3)] flex items-center justify-between">
        <span className="font-mono">v0.1.0</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
          Engine Live
        </span>
      </div>
    </aside>
  );
}
