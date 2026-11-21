"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Workflow,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Search,
  Code,
  ShieldAlert,
  Sparkles,
  Layers,
  History,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";
import { apiRequest } from "../../../../../lib/api";

interface BucketItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

interface TransitionLog {
  id: string;
  timestamp: string;
  scenarioKey: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESET" | "TRANSITION";
  summary: string;
  targetId?: string;
}

interface StepperNode {
  id: string;
  title: string;
  trigger: string;
  description: string;
}

export default function ScenariosPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "petstore";

  // Scenario key isolation
  const [scenarioKey, setScenarioKey] = useState("default");
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);

  // Active bucket & resource
  const [activeResource, setActiveResource] = useState<string>("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State Machines / Stepper
  const orderSteps: StepperNode[] = [
    { id: "created", title: "Created", trigger: "POST /orders", description: "Order payload validated and persisted" },
    { id: "paid", title: "Paid", trigger: "POST /orders/:id/pay", description: "Payment verified via webhook or gateway" },
    { id: "shipped", title: "Shipped", trigger: "POST /orders/:id/ship", description: "Fulfillment confirmed and carrier tracking generated" },
    { id: "delivered", title: "Delivered", trigger: "POST /orders/:id/deliver", description: "Customer receipt confirmed" },
  ];

  const [currentState, setCurrentState] = useState<string>("created");

  // Buckets state loaded from API
  const [bucketsData, setBucketsData] = useState<Record<string, BucketItem[]>>({
    orders: [],
    pets: [],
  });

  const [transitionLogs, setTransitionLogs] = useState<TransitionLog[]>([]);

  // Modals & Panels
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<BucketItem | null>(null);
  const [newRecordJson, setNewRecordJson] = useState(`{\n  "name": "New Record",\n  "status": "active"\n}`);

  const loadScenarioData = useCallback(async () => {
    const [ovRes, itemsRes] = await Promise.all([
      apiRequest<any>(`/api/v1/projects/${projectId}/scenarios?scenarioKey=${encodeURIComponent(scenarioKey)}`),
      apiRequest<any>(`/api/v1/projects/${projectId}/scenarios/buckets/${activeResource}?scenarioKey=${encodeURIComponent(scenarioKey)}&search=${encodeURIComponent(searchQuery)}`),
    ]);

    if (ovRes.data) {
      if (ovRes.data.buckets && typeof ovRes.data.buckets === "object") {
        setBucketsData((prev) => {
          const next = { ...prev };
          Object.keys(ovRes.data.buckets).forEach((k) => {
            if (!next[k]) next[k] = [];
          });
          return next;
        });
      }
      if (Array.isArray(ovRes.data.transitionLogs)) {
        setTransitionLogs(ovRes.data.transitionLogs);
      }
      if (ovRes.data.scenarios?.[0]?.currentState) {
        setCurrentState(ovRes.data.scenarios[0].currentState);
      }
    }

    if (itemsRes.data?.items && Array.isArray(itemsRes.data.items)) {
      setBucketsData((prev) => ({
        ...prev,
        [activeResource]: itemsRes.data.items,
      }));
    } else {
      setBucketsData((prev) => ({
        ...prev,
        [activeResource]: prev[activeResource] || [],
      }));
    }
  }, [projectId, scenarioKey, activeResource, searchQuery]);

  useEffect(() => {
    loadScenarioData();
  }, [loadScenarioData]);

  // Derived filtered items
  const activeItems = useMemo(() => {
    const list = bucketsData[activeResource] || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [bucketsData, activeResource, searchQuery]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset state action
  const handleResetState = async () => {
    await apiRequest(`/api/v1/projects/${projectId}/scenarios/reset`, {
      method: "POST",
      body: JSON.stringify({ scenarioKey }),
    });
    setIsResetConfirmOpen(false);
    await loadScenarioData();
  };

  // Delete single item
  const handleDeleteItem = async (id: string) => {
    await apiRequest(
      `/api/v1/projects/${projectId}/scenarios/buckets/${activeResource}/${id}?scenarioKey=${encodeURIComponent(scenarioKey)}`,
      { method: "DELETE" }
    );
    if (viewingRecord?.id === id) setViewingRecord(null);
    await loadScenarioData();
  };

  // Create new item
  const handleCreateRecord = async () => {
    try {
      JSON.parse(newRecordJson);
      // Post item or apply template
      await apiRequest(`/api/v1/projects/${projectId}/scenarios/templates`, {
        method: "POST",
        body: JSON.stringify({
          template: "crud",
          scenarioKey,
          resource: activeResource,
        }),
      });
      setIsCreateModalOpen(false);
      await loadScenarioData();
    } catch {
      alert("Invalid JSON format");
    }
  };

  // Transition state
  const handleTransition = async (nextState: string) => {
    await apiRequest(`/api/v1/projects/${projectId}/scenarios/transition`, {
      method: "POST",
      body: JSON.stringify({
        scenarioName: "order-lifecycle",
        toState: nextState,
        scenarioKey,
      }),
    });
    setCurrentState(nextState);
    await loadScenarioData();
  };

  // Apply templates
  const handleApplyTemplate = async (type: "orders" | "crud" | "auth") => {
    await apiRequest(`/api/v1/projects/${projectId}/scenarios/templates`, {
      method: "POST",
      body: JSON.stringify({
        template: type,
        scenarioKey,
        resource: type === "crud" ? "pets" : "orders",
      }),
    });
    if (type === "crud") {
      setActiveResource("pets");
    } else {
      setActiveResource("orders");
    }
    setIsTemplateMenuOpen(false);
    await loadScenarioData();
  };

  return (
    <div className="min-h-screen bg-[#101208] text-[#FFFFFF] font-sans">
      {/* Top Header Bar */}
      <header className="border-b border-[#282F14] bg-[#16190B] px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A1A78E] mb-1">
              <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
              <span>/</span>
              <Link href={`/projects/${projectId}`} className="hover:text-white transition-colors">{projectId}</Link>
              <span>/</span>
              <span className="text-[#BFFF3C] font-mono">Scenarios & State</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                <Workflow className="w-5 h-5 text-[#BFFF3C]" />
                Scenarios & State Management
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1D220E] text-[#BFFF3C] border border-[#282F14]">
                Stateful Buckets Active
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3">
            {/* Scenario Key Switcher */}
            <div className="flex items-center bg-[#101208] border border-[#282F14] rounded-md px-2.5 py-1 text-xs">
              <span className="text-[#A1A78E] mr-2 font-mono">Key:</span>
              {isEditingKey ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    placeholder="e.g. ci-run-42"
                    className="bg-transparent border-b border-[#BFFF3C] text-xs font-mono text-white outline-none w-28"
                  />
                  <button
                    onClick={() => {
                      if (customKeyInput.trim()) setScenarioKey(customKeyInput.trim());
                      setIsEditingKey(false);
                    }}
                    className="text-[#BFFF3C] hover:underline px-1"
                  >
                    Set
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCustomKeyInput(scenarioKey);
                    setIsEditingKey(true);
                  }}
                  className="font-mono text-white hover:text-[#BFFF3C] transition-colors"
                >
                  {scenarioKey}
                </button>
              )}
            </div>

            {/* Template Selector */}
            <div className="relative">
              <button
                onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#1D220E] hover:bg-[#282F14] text-white border border-[#282F14] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#BFFF3C]" />
                Apply Template
              </button>
              {isTemplateMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md bg-[#16190B] border border-[#282F14] shadow-xl py-1 z-30">
                  <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-[#A1A78E]">Prebuilt Scenarios</div>
                  <button
                    onClick={() => handleApplyTemplate("orders")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#1D220E] text-white flex flex-col"
                  >
                    <span className="font-semibold">Order Lifecycle</span>
                    <span className="text-[11px] text-[#A1A78E]">Created → Paid → Shipped</span>
                  </button>
                  <button
                    onClick={() => handleApplyTemplate("crud")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#1D220E] text-white flex flex-col"
                  >
                    <span className="font-semibold">CRUD Resource (Pets)</span>
                    <span className="text-[11px] text-[#A1A78E]">Standard REST CRUD collection</span>
                  </button>
                  <button
                    onClick={() => handleApplyTemplate("auth")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#1D220E] text-white flex flex-col"
                  >
                    <span className="font-semibold">Auth Lifecycle</span>
                    <span className="text-[11px] text-[#A1A78E]">Login → Token → Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset State Button */}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset State
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* State Machine Stepper Card */}
        <section className="bg-[#16190B] border border-[#282F14] rounded-lg p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#282F14] mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                  State Machine: Order Lifecycle
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#BFFF3C]/10 text-[#BFFF3C] border border-[#BFFF3C]/20">
                  Active Node: {currentState}
                </span>
              </div>
              <p className="text-xs text-[#A1A78E] mt-0.5">
                Simulate state progression. Requests to trigger endpoints advance the active node.
              </p>
            </div>
            <div className="mt-3 md:mt-0 flex items-center gap-2">
              <span className="text-xs text-[#A1A78E]">Jump to state:</span>
              {orderSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleTransition(step.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    currentState === step.id
                      ? "bg-[#BFFF3C] text-[#101208] font-bold"
                      : "bg-[#1D220E] text-[#A1A78E] hover:text-white border border-[#282F14]"
                  }`}
                >
                  {step.title}
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {orderSteps.map((step, idx) => {
              const isActive = currentState === step.id;
              const isPast = orderSteps.findIndex((s) => s.id === currentState) > idx;

              return (
                <div
                  key={step.id}
                  className={`relative p-4 rounded-lg border transition-all ${
                    isActive
                      ? "bg-[#1D220E] border-[#BFFF3C] shadow-lg shadow-[#BFFF3C]/5"
                      : isPast
                      ? "bg-[#16190B] border-[#282F14] opacity-80"
                      : "bg-[#101208] border-[#282F14] opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-[#A1A78E]">0{idx + 1}</span>
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-[#BFFF3C]" />
                    ) : isActive ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BFFF3C] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#BFFF3C]"></span>
                      </span>
                    ) : (
                      <Circle className="w-4 h-4 text-[#A1A78E]" />
                    )}
                  </div>

                  <h3 className={`text-base font-semibold ${isActive ? "text-[#BFFF3C]" : "text-white"}`}>
                    {step.title}
                  </h3>
                  <div className="mt-2 text-[11px] font-mono bg-[#101208] text-[#A1A78E] px-2 py-1 rounded border border-[#282F14] inline-block">
                    {step.trigger}
                  </div>
                  <p className="mt-2 text-xs text-[#A1A78E] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bucket Management Section */}
        <section className="bg-[#16190B] border border-[#282F14] rounded-lg overflow-hidden">
          {/* Resource Tabs & Search Header */}
          <div className="p-4 border-b border-[#282F14] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-mono text-[#A1A78E] uppercase tracking-wider mr-2">Buckets:</span>
              {Object.keys(bucketsData).map((res) => {
                const count = bucketsData[res]?.length || 0;
                const isSelected = activeResource === res;
                return (
                  <button
                    key={res}
                    onClick={() => setActiveResource(res)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                      isSelected
                        ? "bg-[#BFFF3C] text-[#101208] font-semibold"
                        : "bg-[#1D220E] text-[#A1A78E] hover:text-white border border-[#282F14]"
                    }`}
                  >
                    <span>/{res}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSelected ? "bg-[#101208] text-[#BFFF3C]" : "bg-[#101208] text-[#A1A78E]"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A1A78E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search records..."
                  className="bg-[#101208] border border-[#282F14] rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#A1A78E] outline-none focus:border-[#BFFF3C] w-48 md:w-64"
                />
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#BFFF3C] hover:bg-[#a6e62e] text-[#101208] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Record
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#101208] border-b border-[#282F14] text-[#A1A78E] font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Record ID</th>
                  <th className="py-2.5 px-4 font-medium">Preview / Attributes</th>
                  <th className="py-2.5 px-4 font-medium">Created</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282F14]">
                {activeItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#A1A78E]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Layers className="w-6 h-6 text-[#282F14]" />
                        <span>No records stored in bucket /{activeResource}</span>
                        <span className="text-[11px]">Send a POST request or click "Add Record" to create data.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1D220E]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-white flex items-center gap-2">
                        <span>{item.id}</span>
                        <button
                          onClick={() => handleCopy(item.id, item.id)}
                          className="text-[#A1A78E] hover:text-[#BFFF3C] transition-colors"
                          title="Copy UUID"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-[#A1A78E] font-mono max-w-md truncate">
                        {JSON.stringify(
                          Object.fromEntries(
                            Object.entries(item).filter(([k]) => !["id", "createdAt", "updatedAt"].includes(k))
                          )
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#A1A78E] font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingRecord(item)}
                            className="px-2 py-1 rounded text-[11px] font-mono bg-[#1D220E] hover:bg-[#282F14] text-white border border-[#282F14] transition-colors"
                          >
                            View JSON
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded text-[#F87171] hover:bg-[#EF4444]/10 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Transition Log & State Isolation Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transition Logs */}
          <div className="lg:col-span-2 bg-[#16190B] border border-[#282F14] rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#282F14] mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#BFFF3C]" />
                State Transition Journal
              </h3>
              <span className="text-[11px] font-mono text-[#A1A78E]">{transitionLogs.length} events logged</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {transitionLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded bg-[#101208] border border-[#282F14] text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.action === "CREATE"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : log.action === "TRANSITION"
                          ? "bg-[#BFFF3C]/10 text-[#BFFF3C] border border-[#BFFF3C]/20"
                          : log.action === "DELETE"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-white">{log.summary}</span>
                  </div>
                  <span className="text-[#A1A78E] text-[11px]">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* State Isolation Guide */}
          <div className="bg-[#16190B] border border-[#282F14] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-[#BFFF3C]" />
                Scenario Key Isolation
              </h3>
              <p className="text-xs text-[#A1A78E] leading-relaxed mb-3">
                To isolate concurrent test runs or CI pipelines, pass the scenario key in request headers:
              </p>
              <div className="bg-[#101208] border border-[#282F14] rounded p-2.5 font-mono text-[11px] text-[#BFFF3C] space-y-1">
                <div>X-MockLab-Scenario: {scenarioKey}</div>
                <div className="text-[#A1A78E]">// Or via query string: ?_scenario={scenarioKey}</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#282F14] text-[11px] text-[#A1A78E]">
              Tip: Two different scenario keys never share buckets or lifecycle states.
            </div>
          </div>
        </div>
      </main>

      {/* View JSON Record Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16190B] border border-[#282F14] rounded-lg max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282F14] pb-3">
              <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                <Code className="w-4 h-4 text-[#BFFF3C]" />
                Record Detail: {viewingRecord.id}
              </h3>
              <button
                onClick={() => setViewingRecord(null)}
                className="text-[#A1A78E] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="bg-[#101208] border border-[#282F14] p-3 rounded text-xs font-mono text-white overflow-x-auto max-h-80">
              {JSON.stringify(viewingRecord, null, 2)}
            </pre>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleCopy(JSON.stringify(viewingRecord, null, 2), "modal-json")}
                className="px-3 py-1.5 rounded text-xs font-mono bg-[#1D220E] hover:bg-[#282F14] text-white border border-[#282F14] flex items-center gap-1.5"
              >
                {copiedId === "modal-json" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
                Copy JSON
              </button>
              <button
                onClick={() => setViewingRecord(null)}
                className="px-3 py-1.5 rounded text-xs bg-[#BFFF3C] text-[#101208] font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16190B] border border-[#282F14] rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282F14] pb-3">
              <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#BFFF3C]" />
                Insert into /{activeResource}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#A1A78E] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#A1A78E]">
              The server will generate an immutable UUID and assign timestamps automatically.
            </p>
            <textarea
              value={newRecordJson}
              onChange={(e) => setNewRecordJson(e.target.value)}
              rows={6}
              className="w-full bg-[#101208] border border-[#282F14] rounded p-2.5 text-xs font-mono text-white outline-none focus:border-[#BFFF3C]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-[#A1A78E] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRecord}
                className="px-3 py-1.5 rounded text-xs bg-[#BFFF3C] text-[#101208] font-bold hover:bg-[#a6e62e]"
              >
                Insert Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset State Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16190B] border border-[#282F14] rounded-lg max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#F87171]">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-sm font-semibold text-white">Reset Scenario State?</h3>
            </div>
            <p className="text-xs text-[#A1A78E] leading-relaxed">
              This will purge all active data bucket items for scenario key <strong className="text-white font-mono">{scenarioKey}</strong> and reset state machines to their initial state.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-[#A1A78E] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleResetState}
                className="px-3 py-1.5 rounded text-xs bg-[#EF4444] text-white font-bold hover:bg-[#dc2626]"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
