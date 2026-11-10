"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Compass,
  ArrowRight,
  FolderGit2,
  Terminal,
  BookOpen,
  LifeBuoy,
} from "lucide-react";

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("");

  const suggestedLinks = [
    { name: "Projects Dashboard", href: "/projects", icon: FolderGit2, desc: "Browse your active mock APIs" },
    { name: "Request Playground", href: "/projects/petstore/playground", icon: Terminal, desc: "Execute and debug mock HTTP calls" },
    { name: "Documentation", href: "/docs", icon: BookOpen, desc: "Guides for specs, rules & contracts" },
    { name: "System Status & Error Catalog", href: "/status", icon: LifeBuoy, desc: "Check platform health & error codes" },
  ];

  const filteredLinks = searchQuery
    ? suggestedLinks.filter((l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : suggestedLinks;

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--ink)] flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-xl mx-auto space-y-8 text-center">
        {/* Visual Badge / 404 */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-xs font-mono text-[var(--signal)]">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-ping"></span>
            HTTP 404: RESOURCE_NOT_FOUND
          </div>
          <h1 className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-[var(--ink)]">
            4<span className="text-[var(--signal)]">0</span>4
          </h1>
          <p className="text-sm text-[var(--ink-2)] max-w-md mx-auto">
            The requested page or endpoint could not be found. It may have moved, been deleted, or requires different routing.
          </p>
        </div>

        {/* Near-Miss Diagnostic Box (§6.3) */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-left text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
            <span>MockLab Near-Miss Diagnostic</span>
            <span className="text-[var(--warning)]">Closest match: /projects</span>
          </div>
          <div className="p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink-2)] text-[11px]">
            <span className="text-[var(--signal)]">near_miss</span> &#123; reason: "Route not matched in current router map", status: 404 &#125;
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--ink-3)]" />
          <input
            type="text"
            placeholder="Search pages, documentation, or mocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)] transition-colors"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] transition-all group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--signal)] shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--ink)] flex items-center justify-between">
                    <span>{link.name}</span>
                    <ArrowRight className="w-3 h-3 text-[var(--ink-3)] group-hover:text-[var(--signal)] transition-colors" />
                  </div>
                  <div className="text-[11px] text-[var(--ink-3)] truncate mt-0.5">{link.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Home fallback button */}
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--signal)] text-[var(--surface-0)] font-medium text-xs hover:opacity-90 transition-opacity"
          >
            <Compass className="w-4 h-4" />
            <span>Return to Workspace Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
