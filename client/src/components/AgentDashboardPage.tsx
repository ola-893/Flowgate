import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Agent } from "../types";
import { useToast } from "../lib/toast-context";
import {
  getAgentBalance,
  listAgentStreams,
  closeAgentStream,
  startAgent,
  fundAgent,
  AgentBalance,
  AgentStreamsResponse,
} from "../lib/api";
import {
  Bot,
  Plus,
  Activity,
  DollarSign,
  Globe,
  ChevronDown,
  ChevronUp,
  Wallet,
  Key,
  Play,
  Trash2,
  RefreshCw,
  Zap,
  Send,
  Copy,
  Check,
} from "lucide-react";

function AgentBalancePoller({
  agentId,
  onBalanceUpdate,
}: {
  agentId: string;
  onBalanceUpdate: (balance: AgentBalance) => void;
}) {
  const onUpdateRef = React.useRef(onBalanceUpdate);
  useEffect(() => {
    onUpdateRef.current = onBalanceUpdate;
  }, [onBalanceUpdate]);

  useEffect(() => {
    let isActive = true;

    const poll = async () => {
      try {
        const data = await getAgentBalance(agentId);
        if (isActive) {
          onUpdateRef.current(data);
        }
      } catch {
        // silent — agent may not have funds yet
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [agentId]);

  return null;
}

interface AgentDashboardPageProps {
  agents: Agent[];
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
}

export default function AgentDashboardPage({
  agents,
  onUpdateAgent,
}: AgentDashboardPageProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // Per-agent stream data fetched from backend
  const [agentStreams, setAgentStreams] = useState<
    Record<string, AgentStreamsResponse["streams"]>
  >({});
  const [agentBalances, setAgentBalances] = useState<
    Record<string, AgentBalance>
  >({});

  // Loading states for actions
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fund modal state
  const [fundModalAgent, setFundModalAgent] = useState<string | null>(null);
  const [fundAmountSui, setFundAmountSui] = useState<number>(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Fetch streams for a specific agent
  const fetchStreams = useCallback(async (agentId: string) => {
    try {
      const data = await listAgentStreams(agentId);
      setAgentStreams((prev) => ({ ...prev, [agentId]: data.streams }));
    } catch {
      // silent
    }
  }, []);

  // Fetch streams for all agents on mount so collapsed view has counts
  useEffect(() => {
    agents.forEach((a) => fetchStreams(a.id));
  }, [agents, fetchStreams]);

  // Also refresh streams when an agent is expanded
  useEffect(() => {
    if (expandedAgent) {
      fetchStreams(expandedAgent);
    }
  }, [expandedAgent, fetchStreams]);

  const totalAgents = agents.length;
  const totalSpend = agents.reduce((sum, a) => sum + a.currentSpendSui, 0);
  const totalBudget = agents.reduce((sum, a) => sum + a.maxBudgetSui, 0);

  // Handle start agent
  const handleStartAgent = async (agentId: string) => {
    setLoadingAction(`start-${agentId}`);
    setActionError(null);
    try {
      const result = await startAgent(agentId);
      if (result.started) {
        // Refresh agent data
        await fetchStreams(agentId);
        const balance = await getAgentBalance(agentId);
        setAgentBalances((prev) => ({ ...prev, [agentId]: balance }));
        onUpdateAgent(agentId, {});
        addToast({ variant: "success", title: "Agent started", message: "Streams are now active." });
      } else {
        setActionError(result.message || "Agent could not start — no matching providers");
        addToast({ variant: "error", title: "Agent failed to start", message: result.message || "No matching providers found." });
      }
    } catch (err: any) {
      setActionError(err.message);
      addToast({ variant: "error", title: "Start failed", message: err.message });
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle fund agent
  const handleFundAgent = async (agentId: string) => {
    setLoadingAction(`fund-${agentId}`);
    setActionError(null);
    try {
      const amountMist = Math.floor(fundAmountSui * 1_000_000_000);
      const result = await fundAgent(agentId, amountMist);
      if (result.success) {
        // Update balance locally
        const balance = await getAgentBalance(agentId);
        setAgentBalances((prev) => ({ ...prev, [agentId]: balance }));
        onUpdateAgent(agentId, {});
        setFundModalAgent(null);
        addToast({ variant: "success", title: "Agent funded", message: `${fundAmountSui} SUI deposited successfully.` });
      } else {
        addToast({ variant: "error", title: "Funding failed", message: "Server returned an unsuccessful response." });
      }
    } catch (err: any) {
      const errorMessage = err.message || "Unknown error";
      setActionError(errorMessage);
      addToast({ variant: "error", title: "Funding failed", message: errorMessage });
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle close stream
  const handleCloseStream = async (agentId: string, streamId: string) => {
    setLoadingAction(`close-${streamId}`);
    setActionError(null);
    try {
      await closeAgentStream(agentId, streamId);
      // Refresh streams
      await fetchStreams(agentId);
      // Refresh balance
      const balance = await getAgentBalance(agentId);
      setAgentBalances((prev) => ({ ...prev, [agentId]: balance }));
      addToast({ variant: "success", title: "Stream closed", message: "The stream has been terminated." });
    } catch (err: any) {
      setActionError(err.message);
      addToast({ variant: "error", title: "Close failed", message: err.message });
    } finally {
      setLoadingAction(null);
    }
  };



  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
          <Bot className="w-10 h-10 text-stone-300" />
        </div>
        <div className="text-center flex flex-col gap-2">
          <h2 className="font-serif text-2xl font-bold text-[#1C1A17]">No agents deployed</h2>
          <p className="text-sm text-stone-500 max-w-md">
            Create your first agent to start collecting and paying for data.
          </p>
        </div>
        <button
          onClick={() => navigate("/agent/create")}
          className="py-3 px-7 bg-[#1C1A17] hover:bg-[#2E2E38] text-white font-sans text-sm font-bold rounded-full flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#8C2C16] font-sans text-sm font-semibold mb-2">
            <span className="w-1.5 h-1.5 bg-[#8C2C16]" />
            Agent Management
          </div>
          <h1 className="font-sans text-3xl font-bold text-[#1C1A17]">
            Your Agents
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Monitor and control your deployed agents.
          </p>
        </div>
        <button
          onClick={() => navigate("/agent/create")}
          className="py-2.5 px-5 bg-[#8C2C16] hover:bg-[#A63A23] text-white font-sans text-sm font-bold rounded-full flex items-center gap-1.5 shadow-md transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Agent
        </button>
      </div>

      {/* Global error */}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-sans text-red-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
            <span className="text-xs">dismiss</span>
          </button>
        </div>
      )}

      {/* Fleet Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Agents", value: totalAgents.toString(), icon: <Bot className="w-4 h-4" /> },
          { label: "Total Spent", value: `${totalSpend.toFixed(4)} SUI`, icon: <DollarSign className="w-4 h-4 text-[#8C2C16]" />, accent: "text-[#8C2C16]" },
          { label: "Total Budget", value: `${totalBudget.toFixed(2)} SUI`, icon: <Activity className="w-4 h-4" /> },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-[#FAF9F6] border border-stone-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-stone-400">
              {stat.icon}
              <span className="text-xs font-sans text-stone-400 font-medium">{stat.label}</span>
            </div>
            <span className={`font-sans text-xl font-bold ${stat.accent || "text-[#1C1A17]"}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {agents.map((agent) => {
            const spendPercent = agent.maxBudgetSui > 0 ? (agent.currentSpendSui / agent.maxBudgetSui) * 100 : 0;
            const isExpanded = expandedAgent === agent.id;
            const balance = agentBalances[agent.id];
            const streams = agentStreams[agent.id] || [];

            return (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#FAF9F6] border border-stone-200 rounded-2xl overflow-hidden"
              >
                {/* Balance Poller — renders for all agents to keep collapsed view updated */}
<AgentBalancePoller
                    agentId={agent.id}
                    onBalanceUpdate={(b) => setAgentBalances((prev) => ({ ...prev, [agent.id]: b }))}
                  />

                {/* Agent Header */}
                <div className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 border border-emerald-200">
                    <Bot className="w-6 h-6 text-emerald-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-sans text-sm font-bold uppercase truncate">{agent.name}</span>
                      <span className="px-2 py-0.5 text-xs font-sans font-bold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1" />
                        active
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 truncate">{agent.description || agent.purpose}</p>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-right shrink-0">
                    <div>
                      <span className="text-xs font-sans text-stone-400 block">Spent</span>
                      <span className="font-sans text-sm font-bold text-[#8C2C16]">{agent.currentSpendSui.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-xs font-sans text-stone-400 block">Budget</span>
                      <span className="font-sans text-sm font-bold text-[#1C1A17]">{agent.maxBudgetSui.toFixed(2)}</span>
                    </div>
                    {balance && (
                      <div>
                        <span className="text-xs font-sans text-stone-400 block">Wallet</span>
                        <span className="font-sans text-sm font-bold text-emerald-700">{balance.balanceSui.toFixed(4)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-all shrink-0"
                    title="Expand details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Spend Bar */}
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-sans text-stone-400">Escrow Usage</span>
                    <span className="text-xs font-sans text-stone-500">
                      {agent.currentSpendSui.toFixed(4)} / {agent.maxBudgetSui.toFixed(2)} SUI ({spendPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        spendPercent > 90 ? "bg-red-500" : spendPercent > 70 ? "bg-amber-500" : "bg-[#8C2C16]"
                      }`}
                      style={{ width: `${Math.min(spendPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-stone-200"
                    >
                      <div className="p-5 space-y-5">
                        {/* Agent Wallet */}
                        {agent.walletAddress && (
                          <div className="p-4 bg-white border border-stone-200 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Key className="w-3.5 h-3.5 text-stone-400" />
                                <span className="text-xs font-sans text-stone-400 font-medium">Agent Wallet</span>
                              </div>
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-sans font-bold">
                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                Generated
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-xs text-[#1C1A17] bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                              <Wallet className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate flex-1 min-w-0">{agent.walletAddress}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(agent.walletAddress || "");
                                  setCopiedAddress(agent.id);
                                  addToast({ variant: "success", title: "Copied to clipboard" });
                                  setTimeout(() => setCopiedAddress(null), 2000);
                                }}
                                className="shrink-0 p-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                                title="Copy wallet address"
                              >
                                {copiedAddress === agent.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            {/* Live balance from backend */}
                            {balance && (
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                                <span className="text-xs font-sans text-stone-400">Live Wallet Balance</span>
                                <span className="font-sans text-sm font-bold text-[#8C2C16]">
                                  {balance.balanceSui.toFixed(4)} SUI
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="p-4 bg-white border border-stone-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-3.5 h-3.5 text-stone-400" />
                            <span className="text-xs font-sans text-stone-400 font-medium">Actions</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {/* Start Agent */}
                            <button
                              onClick={() => handleStartAgent(agent.id)}
                              disabled={loadingAction === `start-${agent.id}`}
                              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-sans font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {loadingAction === `start-${agent.id}` ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              Start Agent
                            </button>

                            {/* Fund Agent */}
                            <button
                              onClick={() => setFundModalAgent(agent.id)}
                              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-sans font-bold transition-all flex items-center gap-1.5"
                            >
                              <DollarSign className="w-3 h-3" />
                              Fund Wallet
                            </button>

                            {/* Refresh Balance */}
                            <button
                              onClick={async () => {
                                setLoadingAction(`refresh-${agent.id}`);
                                try {
                                  const b = await getAgentBalance(agent.id);
                                  setAgentBalances((prev) => ({ ...prev, [agent.id]: b }));
                                  addToast({ variant: "success", title: "Balance refreshed", message: `Wallet: ${b.balanceSui.toFixed(4)} SUI` });
                                } catch {
                                  addToast({ variant: "error", title: "Refresh failed", message: "Could not fetch balance." });
                                }
                                setLoadingAction(null);
                              }}
                              className="px-4 py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 rounded-lg text-xs font-sans font-bold transition-all flex items-center gap-1.5"
                            >
                              <RefreshCw className={`w-3 h-3 ${loadingAction === `refresh-${agent.id}` ? "animate-spin" : ""}`} />
                              Refresh Balance
                            </button>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white p-3 border border-stone-100 rounded-xl">
                            <span className="text-xs font-sans text-stone-400 block mb-1">Purpose</span>
                            <span className="font-sans text-sm font-bold text-[#1C1A17] capitalize">{agent.purpose}</span>
                          </div>
                          <div className="bg-white p-3 border border-stone-100 rounded-xl">
                            <span className="text-xs font-sans text-stone-400 block mb-1">Remaining</span>
                            <span className="font-sans text-sm font-bold text-[#1C1A17]">
                              {((agent.maxBudgetSui - agent.currentSpendSui)).toFixed(4)} SUI
                            </span>
                          </div>
                          <div className="bg-white p-3 border border-stone-100 rounded-xl">
                            <span className="text-xs font-sans text-stone-400 block mb-1">Created</span>
                            <span className="font-sans text-xs font-bold text-[#1C1A17]">
                              {new Date(agent.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="bg-white p-3 border border-stone-100 rounded-xl">
                            <span className="text-xs font-sans text-stone-400 block mb-1">Active Streams</span>
                            <span className="font-sans text-sm font-bold text-[#1C1A17]">
                              {streams.length}
                            </span>
                          </div>
                        </div>

                        {/* Active Streams from Backend */}
                        {streams.length > 0 && (
                          <div className="p-4 bg-white border border-stone-200 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-stone-400" />
                                <span className="text-xs font-sans text-stone-400 font-medium">Active Streams</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {streams.map((stream) => (
                                <div key={stream.streamId} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-lg">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-stone-700 truncate">{stream.endpoint}</span>
                                      <span className="text-[10px] text-stone-400 font-mono">
                                        {(stream.ratePerSecondMist / 1_000_000_000).toFixed(6)} SUI/s
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-[10px] text-stone-400 font-mono truncate">
                                        ID: {stream.streamId.substring(0, 16)}...
                                      </span>
                                      {stream.balanceMist !== undefined && (
                                        <span className="text-[10px] text-[#8C2C16] font-mono font-bold">
                                          Balance: {stream.balanceSui.toFixed(4)} SUI
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleCloseStream(agent.id, stream.streamId)}
                                    disabled={loadingAction === `close-${stream.streamId}`}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-sans font-bold transition-all flex items-center gap-1 shrink-0 ml-2"
                                  >
                                    {loadingAction === `close-${stream.streamId}` ? (
                                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-2.5 h-2.5" />
                                    )}
                                    Close
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Agent Config Code Block */}
                        <div className="bg-[#1C1A17] text-[#8AF2D0] p-4 rounded-xl font-mono text-[10px] space-y-0.5 overflow-x-auto whitespace-pre">
                          <p className="text-white/40">// Agent Config</p>
                          <p>id: "{agent.id}"</p>
                          <p>name: "{agent.name}"</p>
                          <p>purpose: {agent.purpose}</p>
                          <p>budget: {agent.maxBudgetSui} SUI</p>
                          <p>spent: {agent.currentSpendSui.toFixed(6)} SUI</p>
                          <p>wallet: {agent.walletAddress || "pending..."}</p>
                          <p>streams: {streams.length}</p>
                          <p>created: {agent.createdAt}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Fund Modal */}
      <AnimatePresence>
        {fundModalAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setFundModalAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FAF9F6] border border-stone-200 rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans text-lg font-bold text-[#1C1A17]">Fund Agent Wallet</h3>
                <button
                  onClick={() => setFundModalAgent(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-stone-500 mb-4">
                This will transfer SUI from a test wallet to the agent's wallet for demo purposes.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-sans text-stone-500 font-medium">Amount (SUI)</label>
                  <div className="flex gap-2">
                    {[0.5, 1, 2, 5].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setFundAmountSui(amt)}
                        className={`flex-1 py-2 border rounded-lg text-xs font-sans font-bold transition-all ${
                          fundAmountSui === amt
                            ? "border-[#8C2C16] bg-[#8C2C16]/5 text-[#8C2C16]"
                            : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                        }`}
                      >
                        {amt} SUI
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={fundAmountSui}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFundAmountSui(val > 0 ? val : 0.1);
                    }}
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl font-sans text-sm text-[#1C1A17] focus:outline-none focus:border-[#8C2C16] focus:ring-1 focus:ring-[#8C2C16]/20 transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFundModalAgent(null)}
                    className="flex-1 py-3 px-6 bg-transparent hover:bg-[#1C1A17]/5 text-[#1C1A17] border border-[#1C1A17]/30 rounded-full text-sm font-sans font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => fundModalAgent && handleFundAgent(fundModalAgent)}
                    disabled={loadingAction?.startsWith("fund-") || fundAmountSui <= 0}
                    className="flex-1 py-3 px-6 bg-[#8C2C16] hover:bg-[#A63A23] disabled:opacity-40 text-white font-sans text-sm font-bold rounded-full flex items-center justify-center gap-2 transition-all"
                  >
                    {loadingAction?.startsWith("fund-") ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Fund {fundAmountSui} SUI
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
