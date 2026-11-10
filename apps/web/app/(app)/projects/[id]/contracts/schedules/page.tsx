"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarClock,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Sliders,
  Mail,
  X,
  ExternalLink,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  name: string;
  cron: string;
  cadence: string;
  enabled: boolean;
  lastVerdict: "PASS" | "BREAKING" | "ERROR" | null;
  lastRunTime: string;
  nextRunTime: string;
  notifyEmail: string;
}

export default function ContractSchedulesPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "petstore";

  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: "sched_1",
      name: "Hourly Verification Sweeper",
      cron: "0 * * * *",
      cadence: "Every hour at minute 0",
      enabled: true,
      lastVerdict: "BREAKING",
      lastRunTime: "18 minutes ago",
      nextRunTime: "in 42 minutes",
      notifyEmail: "dev-alerts@mocklab.dev",
    },
    {
      id: "sched_2",
      name: "Nightly Provider Audit",
      cron: "0 0 * * *",
      cadence: "Daily at 00:00 UTC",
      enabled: true,
      lastVerdict: "PASS",
      lastRunTime: "yesterday at 00:00",
      nextRunTime: "in 23 hours",
      notifyEmail: "backend-team@mocklab.dev",
    },
    {
      id: "sched_3",
      name: "Weekly Comprehensive Run",
      cron: "0 0 * * 0",
      cadence: "Every Sunday at 00:00 UTC",
      enabled: false,
      lastVerdict: null,
      lastRunTime: "Never",
      nextRunTime: "Disabled",
      notifyEmail: "leads@mocklab.dev",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState("");
  const [newSchedulePreset, setNewSchedulePreset] = useState("hourly");
  const [newScheduleNotify, setNewScheduleNotify] = useState("team@example.com");

  const handleToggle = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreate = () => {
    if (!newScheduleName.trim()) return;
    const cron =
      newSchedulePreset === "hourly"
        ? "0 * * * *"
        : newSchedulePreset === "daily"
        ? "0 0 * * *"
        : "0 0 * * 0";
    const cadence =
      newSchedulePreset === "hourly"
        ? "Every hour at minute 0"
        : newSchedulePreset === "daily"
        ? "Daily at 00:00 UTC"
        : "Weekly on Sunday";

    const newSched: ScheduleItem = {
      id: `sched_${Date.now()}`,
      name: newScheduleName,
      cron,
      cadence,
      enabled: true,
      lastVerdict: null,
      lastRunTime: "Never",
      nextRunTime: "in 1 hour",
      notifyEmail: newScheduleNotify,
    };

    setSchedules([newSched, ...schedules]);
    setIsModalOpen(false);
    setNewScheduleName("");
  };

  const getVerdictBadge = (verdict: string | null) => {
    switch (verdict) {
      case "PASS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS
          </span>
        );
      case "BREAKING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            BREAKING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-[#A1A78E] border border-[#282F14]">
            Not run yet
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#101208] text-white font-sans">
      {/* Top Header */}
      <header className="border-b border-[#282F14] bg-[#16190B] px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A1A78E] mb-1">
              <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
              <span>/</span>
              <Link href={`/projects/${projectId}`} className="hover:text-white transition-colors">{projectId}</Link>
              <span>/</span>
              <Link href={`/projects/${projectId}/contracts`} className="hover:text-white transition-colors">Contracts</Link>
              <span>/</span>
              <span className="text-[#BFFF3C] font-mono">Schedules</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#BFFF3C]" />
                Automated Verification Schedules
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1D220E] text-[#BFFF3C] border border-[#282F14]">
                Sweeper Active
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#BFFF3C] hover:bg-[#a6e62e] text-[#101208] transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Schedule
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-[#16190B] border border-[#282F14] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#282F14] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Active Schedules ({schedules.length})
              </h2>
              <p className="text-xs text-[#A1A78E] mt-0.5">
                Periodic runs verify the live provider in background without waiting for CI commits.
              </p>
            </div>
            <div className="text-xs font-mono text-[#A1A78E]">
              Notifications: Email sent on <strong className="text-rose-400">BREAKING</strong> only (§6.8)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#101208] border-b border-[#282F14] text-[#A1A78E] font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Schedule Name</th>
                  <th className="py-2.5 px-4 font-medium">Cron Expression & Cadence</th>
                  <th className="py-2.5 px-4 font-medium">Next Run</th>
                  <th className="py-2.5 px-4 font-medium">Last Verdict</th>
                  <th className="py-2.5 px-4 font-medium">Notification Target</th>
                  <th className="py-2.5 px-4 font-medium text-center">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282F14]">
                {schedules.map((sched) => (
                  <tr key={sched.id} className="hover:bg-[#1D220E]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {sched.name}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="text-[#BFFF3C] font-bold">{sched.cron}</div>
                      <div className="text-[11px] text-[#A1A78E]">{sched.cadence}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#A1A78E]">
                      {sched.nextRunTime}
                    </td>
                    <td className="py-3 px-4">
                      {getVerdictBadge(sched.lastVerdict)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#A1A78E] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#BFFF3C]" />
                      {sched.notifyEmail}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(sched.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${
                          sched.enabled
                            ? "bg-[#BFFF3C]/10 text-[#BFFF3C] border border-[#BFFF3C]/30"
                            : "bg-[#101208] text-[#A1A78E] border border-[#282F14]"
                        }`}
                      >
                        {sched.enabled ? "ENABLED" : "PAUSED"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => alert(`Triggered manual execution of '${sched.name}'`)}
                          className="px-2 py-1 rounded text-[11px] font-mono bg-[#1D220E] hover:bg-[#282F14] text-white border border-[#282F14] flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current text-[#BFFF3C]" />
                          Run Now
                        </button>
                        <button
                          onClick={() => handleDelete(sched.id)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* New Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16190B] border border-[#282F14] rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282F14] pb-3">
              <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#BFFF3C]" />
                Create Verification Schedule
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#A1A78E] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#A1A78E] block mb-1 font-mono">Schedule Name</label>
                <input
                  type="text"
                  value={newScheduleName}
                  onChange={(e) => setNewScheduleName(e.target.value)}
                  placeholder="e.g. Daily Provider Audit"
                  className="w-full bg-[#101208] border border-[#282F14] rounded p-2 text-white outline-none focus:border-[#BFFF3C]"
                />
              </div>

              <div>
                <label className="text-[#A1A78E] block mb-1 font-mono">Cadence Preset (§6.8)</label>
                <select
                  value={newSchedulePreset}
                  onChange={(e) => setNewSchedulePreset(e.target.value)}
                  className="w-full bg-[#101208] border border-[#282F14] rounded p-2 text-white outline-none focus:border-[#BFFF3C]"
                >
                  <option value="hourly">Hourly (0 * * * *)</option>
                  <option value="daily">Daily at 00:00 UTC (0 0 * * *)</option>
                  <option value="weekly">Weekly on Sunday (0 0 * * 0)</option>
                </select>
              </div>

              <div>
                <label className="text-[#A1A78E] block mb-1 font-mono">Alert Email (Breaking Only)</label>
                <input
                  type="email"
                  value={newScheduleNotify}
                  onChange={(e) => setNewScheduleNotify(e.target.value)}
                  placeholder="alerts@company.com"
                  className="w-full bg-[#101208] border border-[#282F14] rounded p-2 text-white outline-none focus:border-[#BFFF3C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#282F14]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-[#A1A78E] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-3.5 py-1.5 rounded text-xs bg-[#BFFF3C] text-[#101208] font-bold hover:bg-[#a6e62e]"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
