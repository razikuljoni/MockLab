"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ListTree,
  Plus,
  Search,
  Terminal,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function EndpointsListPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "petstore";

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");

  const endpoints = [
    {
      operationId: "GET /pets",
      method: "GET",
      path: "/pets",
      summary: "List all pets with pagination",
      tag: "Pets",
      rulesCount: 3,
      hitCount: 14290,
      contractStatus: "PASS",
    },
    {
      operationId: "POST /pets",
      method: "POST",
      path: "/pets",
      summary: "Create a new pet in the stateful bucket",
      tag: "Pets",
      rulesCount: 2,
      hitCount: 5210,
      contractStatus: "PASS",
    },
    {
      operationId: "GET /pets/{petId}",
      method: "GET",
      path: "/pets/{petId}",
      summary: "Find pet by unique ID or throw 404",
      tag: "Pets",
      rulesCount: 4,
      hitCount: 22400,
      contractStatus: "PASS",
    },
    {
      operationId: "PUT /pets/{petId}",
      method: "PUT",
      path: "/pets/{petId}",
      summary: "Update existing pet attributes",
      tag: "Pets",
      rulesCount: 2,
      hitCount: 890,
      contractStatus: "PASS",
    },
    {
      operationId: "DELETE /pets/{petId}",
      method: "DELETE",
      path: "/pets/{petId}",
      summary: "Delete a pet from stateful bucket",
      tag: "Pets",
      rulesCount: 1,
      hitCount: 450,
      contractStatus: "PASS",
    },
    {
      operationId: "GET /store/inventory",
      method: "GET",
      path: "/store/inventory",
      summary: "Returns pet inventory status map",
      tag: "Store",
      rulesCount: 2,
      hitCount: 3120,
      contractStatus: "PASS",
    },
    {
      operationId: "POST /store/order",
      method: "POST",
      path: "/store/order",
      summary: "Place an order for a pet",
      tag: "Store",
      rulesCount: 2,
      hitCount: 1840,
      contractStatus: "PASS",
    },
    {
      operationId: "GET /store/order/{orderId}",
      method: "GET",
      path: "/store/order/{orderId}",
      summary: "Find purchase order by ID",
      tag: "Store",
      rulesCount: 1,
      hitCount: 620,
      contractStatus: "PASS",
    },
  ];

  const tags = ["All", "Pets", "Store"];

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30";
      case "POST":
        return "bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30";
      case "PUT":
        return "bg-[#67E8F9]/15 text-[#67E8F9] border-[#67E8F9]/30";
      case "PATCH":
        return "bg-[#C084FC]/15 text-[#C084FC] border-[#C084FC]/30";
      case "DELETE":
        return "bg-[#F87171]/15 text-[#F87171] border-[#F87171]/30";
      default:
        return "bg-[#A8B09A]/15 text-[#A8B09A] border-[#A8B09A]/30";
    }
  };

  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesSearch =
      ep.path.toLowerCase().includes(search.toLowerCase()) ||
      ep.summary.toLowerCase().includes(search.toLowerCase()) ||
      ep.method.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === "All" || ep.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Endpoints</h1>
          <p className="text-xs text-[var(--ink-2)]">
            OpenAPI operations, active mock response rules, and contract verification status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/import`}
            className="px-3.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-[var(--ink)] font-medium text-xs hover:bg-[var(--surface-2)] transition-colors"
          >
            Re-import Spec
          </Link>
          <button className="px-3.5 py-1.5 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Endpoint</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-[var(--signal-dim)] text-[var(--signal)]"
                  : "bg-[var(--surface-1)] border border-[var(--border)] text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search endpoints by path or method..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)]"
          />
        </div>
      </div>

      {/* Endpoints Table (§2.1 Screen 9) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--ink-3)] uppercase tracking-wider font-mono">
              <tr>
                <th className="p-3.5 w-24">Method</th>
                <th className="p-3.5">Path &amp; Summary</th>
                <th className="p-3.5 w-28">Tag</th>
                <th className="p-3.5 w-24 text-right">Rules</th>
                <th className="p-3.5 w-28 text-right">Total Hits</th>
                <th className="p-3.5 w-28 text-center">Contract</th>
                <th className="p-3.5 w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
              {filteredEndpoints.map((ep) => (
                <tr key={ep.operationId} className="hover:bg-[var(--surface-2)] transition-colors">
                  {/* Method Chip (§3.1) */}
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${getMethodBadgeClass(
                        ep.method
                      )}`}
                    >
                      {ep.method}
                    </span>
                  </td>

                  {/* Path & Summary */}
                  <td className="p-3.5">
                    <div className="font-mono font-medium text-[var(--ink)] text-xs">
                      {ep.path}
                    </div>
                    <div className="text-[11px] text-[var(--ink-3)] truncate max-w-md">
                      {ep.summary}
                    </div>
                  </td>

                  {/* Tag */}
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[10px] text-[var(--ink-2)] font-mono">
                      {ep.tag}
                    </span>
                  </td>

                  {/* Rules Count */}
                  <td className="p-3.5 text-right font-mono">
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[11px] font-semibold text-[var(--ink)]">
                      {ep.rulesCount}
                    </span>
                  </td>

                  {/* Total Hits */}
                  <td className="p-3.5 text-right font-mono text-[var(--signal)]">
                    {ep.hitCount.toLocaleString()}
                  </td>

                  {/* Contract Status */}
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 font-semibold text-[10px]">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{ep.contractStatus}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/projects/${projectId}/playground?endpoint=${encodeURIComponent(
                          ep.operationId
                        )}`}
                        className="p-1.5 rounded hover:bg-[var(--surface-0)] text-[var(--ink-2)] hover:text-[var(--signal)]"
                        title="Send in Playground"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/projects/${projectId}/endpoints/users/rules`}
                        className="p-1.5 rounded hover:bg-[var(--surface-0)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                        title="Edit Mock Rules"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
