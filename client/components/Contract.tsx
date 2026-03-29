"use client";

import { useState, useCallback, useEffect } from "react";
import {
  postJob,
  submitBid,
  acceptBid,
  completeJob,
  viewHubStats,
  viewJob,
  viewBid,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <div className="group rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm p-px transition-all focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100/50 shadow-sm">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/40 shadow-sm px-4 py-3 font-mono text-sm backdrop-blur-md">
      <span style={{ color }} className="font-bold">fn</span>
      <span className="text-slate-800 font-semibold">{name}</span>
      <span className="text-slate-500 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-slate-400 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Status Config ────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; variant: "success" | "warning" | "info" }> = {
  Open: { color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10", border: "border-[#fbbf24]/20", dot: "bg-[#fbbf24]", variant: "warning" },
  Assigned: { color: "text-[#4fc3f7]", bg: "bg-[#4fc3f7]/10", border: "border-[#4fc3f7]/20", dot: "bg-[#4fc3f7]", variant: "info" },
  Completed: { color: "text-[#34d399]", bg: "bg-[#34d399]/10", border: "border-[#34d399]/20", dot: "bg-[#34d399]", variant: "success" },
};

// ── Main Component ───────────────────────────────────────────

type Tab = "stats" | "post" | "bid" | "explore";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Stats State
  const [hubStats, setHubStats] = useState<Record<string, string> | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Post Job State
  const [postTitle, setPostTitle] = useState("");
  const [postDesc, setPostDesc] = useState("");
  const [postBudget, setPostBudget] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Submit Bid State
  const [bidJobId, setBidJobId] = useState("");
  const [bidProposal, setBidProposal] = useState("");
  const [bidAskPrice, setBidAskPrice] = useState("");
  const [isBidding, setIsBidding] = useState(false);

  // Explore State
  const [exploreId, setExploreId] = useState("");
  const [exploreType, setExploreType] = useState<"job" | "bid">("job");
  const [exploreData, setExploreData] = useState<Record<string, string> | null>(null);
  const [isExploring, setIsExploring] = useState(false);
  
  // All Jobs list state
  const [allJobs, setAllJobs] = useState<{id: string, data: Record<string, string>}[]>([]);
  const [isLoadingAllJobs, setIsLoadingAllJobs] = useState(false);

  // Actions in Explore
  const [acceptBidId, setAcceptBidId] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleFetchStats = useCallback(async () => {
    setError(null);
    setIsLoadingStats(true);
    try {
      const result = await viewHubStats();
      if (result && typeof result === "object") {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(result)) {
          mapped[String(k)] = String(v);
        }
        setHubStats(mapped);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const handleLoadAllJobs = useCallback(async () => {
    setIsLoadingAllJobs(true);
    setAllJobs([]);
    setError(null);
    try {
      const stats = await viewHubStats();
      if (stats && typeof stats === "object" && stats.total_jobs) {
        const total = Number(stats.total_jobs);
        const jobsList = [];
        for (let i = 1; i <= total; i++) {
          try {
            const jobData = await viewJob(i);
            if (jobData && typeof jobData === "object") {
              const mapped: Record<string, string> = {};
              for (const [k, v] of Object.entries(jobData)) mapped[String(k)] = String(v);
              jobsList.push({ id: String(i), data: mapped });
            }
          } catch (e) {
             console.warn("Could not load job", i, e);
          }
        }
        setAllJobs(jobsList);
      }
    } catch (err: unknown) {
      setError("Failed to load all jobs.");
    } finally {
      setIsLoadingAllJobs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "stats") {
      handleFetchStats();
    } else if (activeTab === "explore" && exploreType === "job") {
      handleLoadAllJobs();
      setExploreData(null);
    }
  }, [activeTab, exploreType, handleFetchStats, handleLoadAllJobs]);

  const handlePostJob = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!postTitle.trim() || !postDesc.trim() || !postBudget.trim()) return setError("Fill in all fields");
    if (isNaN(Number(postBudget))) return setError("Budget must be a number");
    
    setError(null);
    setIsPosting(true);
    setTxStatus("Awaiting signature...");
    try {
      await postJob(walletAddress, postTitle.trim(), postDesc.trim(), Number(postBudget));
      setTxStatus("Job posted on-chain!");
      setPostTitle("");
      setPostDesc("");
      setPostBudget("");
      setTimeout(() => setTxStatus(null), 5000);
      handleFetchStats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsPosting(false);
    }
  }, [walletAddress, postTitle, postDesc, postBudget, handleFetchStats]);

  const handleSubmitBid = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!bidJobId.trim() || !bidProposal.trim() || !bidAskPrice.trim()) return setError("Fill in all fields");
    if (isNaN(Number(bidJobId)) || isNaN(Number(bidAskPrice))) return setError("IDs and amounts must be numbers");
    
    setError(null);
    setIsBidding(true);
    setTxStatus("Awaiting signature...");
    try {
      await submitBid(walletAddress, Number(bidJobId), bidProposal.trim(), Number(bidAskPrice));
      setTxStatus("Bid submitted on-chain!");
      setBidJobId("");
      setBidProposal("");
      setBidAskPrice("");
      setTimeout(() => setTxStatus(null), 5000);
      handleFetchStats();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsBidding(false);
    }
  }, [walletAddress, bidJobId, bidProposal, bidAskPrice, handleFetchStats]);

  const handleExploreSingle = useCallback(async () => {
    if (!exploreId.trim() || isNaN(Number(exploreId))) return setError("Enter a valid numeric ID");
    setError(null);
    setIsExploring(true);
    setExploreData(null);
    try {
      const result = await (exploreType === "job" ? viewJob(Number(exploreId)) : viewBid(Number(exploreId)));
      if (result && typeof result === "object") {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(result)) mapped[String(k)] = String(v);
        setExploreData(mapped);
      } else {
        setError(`${exploreType === "job" ? "Job" : "Bid"} not found`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsExploring(false);
    }
  }, [exploreId, exploreType]);

  const handleAcceptBid = useCallback(async (jobId: string, bidIdToAccept: string) => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!bidIdToAccept.trim() || isNaN(Number(bidIdToAccept))) return setError("Valid Bid ID required");

    setError(null);
    setIsAccepting(true);
    setTxStatus("Awaiting signature...");
    try {
      await acceptBid(walletAddress, Number(jobId), Number(bidIdToAccept));
      setTxStatus("Bid accepted on-chain!");
      setAcceptBidId("");
      handleLoadAllJobs();
      if (exploreData) handleExploreSingle();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsAccepting(false);
    }
  }, [walletAddress, handleLoadAllJobs, exploreData, handleExploreSingle]);

  const handleCompleteJob = useCallback(async (jobId: string) => {
    if (!walletAddress) return setError("Connect wallet first");

    setError(null);
    setIsCompleting(true);
    setTxStatus("Awaiting signature...");
    try {
      await completeJob(walletAddress, Number(jobId));
      setTxStatus("Job completed on-chain!");
      handleLoadAllJobs();
      if (exploreData) handleExploreSingle();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsCompleting(false);
    }
  }, [walletAddress, handleLoadAllJobs, exploreData, handleExploreSingle]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "stats", label: "Hub Stats", icon: <RefreshIcon />, color: "#34d399" },
    { key: "post", label: "Post Job", icon: <PackageIcon />, color: "#4fc3f7" },
    { key: "bid", label: "Submit Bid", icon: <CheckIcon />, color: "#7c6cf0" },
    { key: "explore", label: "Explore", icon: <SearchIcon />, color: "#fbbf24" },
  ];

  return (
    <div className="w-full max-w-3xl animate-fade-in-up-delayed mt-6 relative z-10">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 shadow-lg backdrop-blur-md animate-slide-down">
          <span className="mt-0.5 text-red-500"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-700 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 shadow-lg backdrop-blur-md animate-slide-down">
          <span className="text-emerald-600">
            {txStatus.includes("on-chain") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm font-semibold text-emerald-800">{txStatus}</span>
        </div>
      )}

      {/* Main Glass Card Container */}
      <div className="rounded-3xl shadow-[0_8px_32px_rgba(74,75,215,0.1)] bg-white/70 backdrop-blur-2xl border border-white/60 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/50 px-6 py-5 bg-white/40">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-cyan-100 border border-white shadow-sm text-indigo-500">
                <PackageIcon />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Freelancer Hub Tracker</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px] bg-blue-100/50 text-blue-700 border-blue-200 shadow-sm backdrop-blur-md">Soroban</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200/50 px-2 overflow-x-auto bg-white/20">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-4 whitespace-nowrap sm:px-6 py-4 text-sm font-bold transition-all",
                  activeTab === t.key ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : { color: 'currentColor', opacity: 0.5 }}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-[4px] transition-all shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}99)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            
            {/* Stats Tab */}
            {activeTab === "stats" && (
              <div className="space-y-6 animate-fade-in-up">
                <MethodSignature name="view_hub_stats" params="()" returns="-> HubStats" color="#34d399" />
                
                <div className="flex items-center justify-between mt-6">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Platform Statistics</h4>
                  <button onClick={handleFetchStats} disabled={isLoadingStats} className="text-slate-400 hover:text-indigo-500 disabled:opacity-50 transition-colors p-2 rounded-full hover:bg-white/50">
                    <RefreshIcon />
                  </button>
                </div>

                {isLoadingStats && <div className="text-slate-500 text-sm animate-pulse flex items-center gap-2"><SpinnerIcon /> Syncing with Soroban...</div>}

                {hubStats && !isLoadingStats && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Total Jobs", val: hubStats?.total_jobs || "0" },
                      { label: "Total Bids", val: hubStats?.total_bids || "0" },
                      { label: "Completed", val: hubStats?.total_completed || "0" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</div>
                        <div className="text-4xl font-extrabold text-slate-800 font-mono tracking-tight">{stat.val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Post Job Tab */}
            {activeTab === "post" && (
              <div className="space-y-6 animate-fade-in-up">
                <MethodSignature name="post_job" params="(title: String, descrip: String, budget: u64)" color="#4fc3f7" />
                <div className="space-y-4">
                  <Input label="Job Title" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="e.g. Frontend Developer" />
                  <Input label="Description" value={postDesc} onChange={(e) => setPostDesc(e.target.value)} placeholder="Requirements..." />
                  <Input label="Budget (Stroops)" type="number" value={postBudget} onChange={(e) => setPostBudget(e.target.value)} placeholder="e.g. 1000000000" />
                </div>
                
                <div className="pt-2">
                  {walletAddress ? (
                    <ShimmerButton onClick={handlePostJob} disabled={isPosting} shimmerColor="#4fc3f7" className="w-full h-14 text-sm font-bold shadow-lg shadow-sky-500/20">
                      {isPosting ? <><SpinnerIcon /> Posting to Ledger...</> : <><PackageIcon /> Post Job on Stellar</>}
                    </ShimmerButton>
                  ) : (
                    <ConnectPrompt onConnect={onConnect} isConnecting={isConnecting} color="#4fc3f7" label="Connect Wallet to Post Job" />
                  )}
                </div>
              </div>
            )}

            {/* Submit Bid Tab */}
            {activeTab === "bid" && (
              <div className="space-y-6 animate-fade-in-up">
                <MethodSignature name="submit_bid" params="(job_id: u64, proposal: String, ask_price: u64)" color="#7c6cf0" />
                <div className="space-y-4">
                  <Input label="Job ID" type="number" value={bidJobId} onChange={(e) => setBidJobId(e.target.value)} placeholder="e.g. 1" />
                  <Input label="Proposal" value={bidProposal} onChange={(e) => setBidProposal(e.target.value)} placeholder="Why I'm the best fit..." />
                  <Input label="Ask Price (Stroops)" type="number" value={bidAskPrice} onChange={(e) => setBidAskPrice(e.target.value)} placeholder="e.g. 950000000" />
                </div>
                <div className="pt-2">
                  {walletAddress ? (
                    <ShimmerButton onClick={handleSubmitBid} disabled={isBidding} shimmerColor="#7c6cf0" className="w-full h-14 text-sm font-bold shadow-lg shadow-indigo-500/20">
                      {isBidding ? <><SpinnerIcon /> Submitting to Escrow...</> : <><CheckIcon /> Submit Bid on-chain</>}
                    </ShimmerButton>
                  ) : (
                    <ConnectPrompt onConnect={onConnect} isConnecting={isConnecting} color="#7c6cf0" label="Connect Wallet to Submit Bid" />
                  )}
                </div>
              </div>
            )}

            {/* Explore Tab (All Jobs Card Format) */}
            {activeTab === "explore" && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex gap-3 mb-2 bg-slate-100/50 p-1.5 rounded-xl border border-white/60 shadow-inner">
                  {(["job", "bid"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => { setExploreType(type); setExploreData(null); }}
                      className={cn(
                        "flex-1 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-sm",
                        exploreType === type ? "bg-white text-indigo-600 border border-slate-200" : "text-slate-500 hover:bg-white/50 border border-transparent"
                      )}
                    >
                      Browse {type}s
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="col-span-1">
                    <Input label={`Specific ${exploreType} ID`} type="number" value={exploreId} onChange={(e) => setExploreId(e.target.value)} placeholder={`Look up a specific ${exploreType}...`} />
                  </div>
                  <ShimmerButton onClick={handleExploreSingle} disabled={isExploring} shimmerColor="#fbbf24" className="w-full h-12 text-sm font-bold shadow-md shadow-amber-500/10">
                    {isExploring ? <SpinnerIcon /> : <><SearchIcon /> Search</>}
                  </ShimmerButton>
                </div>

                {exploreData && (
                  <div className="mt-4 border-t border-slate-200/50 pt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Search Result</h4>
                    <JobCard data={exploreData} jobId={exploreId} exploreType={exploreType} onAccept={handleAcceptBid} onComplete={handleCompleteJob} walletAddress={walletAddress} />
                  </div>
                )}

                {/* Display All Jobs from state */}
                {exploreType === "job" && !exploreData && (
                  <div className="mt-8 border-t border-slate-200/50 pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">All Open Jobs</h4>
                      <button onClick={handleLoadAllJobs} disabled={isLoadingAllJobs} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-full text-xs font-semibold flex items-center gap-2">
                        {isLoadingAllJobs ? <SpinnerIcon /> : <RefreshIcon />} Refresh
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {allJobs.length === 0 && !isLoadingAllJobs && (
                        <div className="col-span-full py-12 text-center text-slate-400 font-mono text-sm border-2 border-dashed border-slate-200 rounded-3xl bg-white/20">
                          No jobs found on the network.
                        </div>
                      )}
                      
                      {allJobs.map((job) => (
                         <JobCard key={job.id} data={job.data} jobId={job.id} exploreType="job" onAccept={handleAcceptBid} onComplete={handleCompleteJob} walletAddress={walletAddress} />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200/50 px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between bg-white/30 backdrop-blur-md rounded-b-3xl gap-4">
            <p className="text-xs font-semibold text-slate-500">Freelancer Hub &middot; Soroban Testnet</p>
            <div className="flex items-center gap-3">
              {["Open", "Assigned", "Completed"].map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full shadow-sm", STATUS_CONFIG[s]?.dot ?? "bg-slate-300")} />
                  <span className="font-mono font-bold uppercase tracking-widest text-[9px] text-slate-600">{s}</span>
                  {i < 2 && <span className="text-slate-300 text-[10px]">&mdash;</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for rendering the beautiful Glass Card
function JobCard({ data, jobId, exploreType, onAccept, onComplete, walletAddress }: any) {
  const [acceptId, setAcceptId] = useState("");
  
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl shadow-lg shadow-indigo-500/5 overflow-hidden transition-all hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant={STATUS_CONFIG[data.status]?.variant || "info"} className="px-3 py-1 font-bold tracking-wider text-[10px] uppercase shadow-sm">
            <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5 inline-block", STATUS_CONFIG[data.status]?.dot || "bg-slate-400")} />
            {data.status}
          </Badge>
          {jobId && <span className="text-xs font-mono font-bold text-slate-400 bg-white/50 px-2 py-1 rounded-md border border-slate-100">ID: {jobId}</span>}
        </div>
        
        <h5 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
          {data.title || data.proposal || (exploreType === "bid" ? "Bid Submission" : "Untitled")}
        </h5>
        <div className="text-sm text-slate-600 leading-relaxed max-h-24 overflow-y-auto pr-2">
          {data.description || data.proposal || "No details provided."}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {Object.entries(data).map(([key, val]: any) => {
            if (["title", "description", "status"].includes(key)) return null;
            return (
               <div key={key} className="flex items-center justify-between bg-white/40 border border-slate-100 rounded-lg p-2.5">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key.replace("_", " ")}</span>
                 <span className="font-mono text-sm font-bold text-slate-800 shrink-0 truncate max-w-[150px]">{val}</span>
               </div>
            )
          })}
        </div>
      </div>
      
      {exploreType === "job" && data.status === "Open" && (
        <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-white/50 border-t border-slate-200/50 mt-auto">
          <div className="flex gap-2">
            <div className="flex-1">
              <input value={acceptId} onChange={(e) => setAcceptId(e.target.value)} type="number" placeholder="Bid ID" className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono shadow-inner outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <button
              onClick={() => onAccept(jobId || "1", acceptId)}
              disabled={!walletAddress || !acceptId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
            >
              <CheckIcon /> Accept
            </button>
          </div>
        </div>
      )}

      {exploreType === "job" && data.status === "Assigned" && (
        <div className="p-4 bg-emerald-50/50 border-t border-emerald-100/50 mt-auto">
          <button
            onClick={() => onComplete(jobId || "1")}
            disabled={!walletAddress}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <CheckIcon /> Mark Completed
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectPrompt({ onConnect, isConnecting, color, label }: { onConnect: () => void, isConnecting: boolean, color: string, label: string }) {
  return (
    <button
      onClick={onConnect}
      disabled={isConnecting}
      style={{ borderColor: color, color: color }}
      className="w-full rounded-2xl border-2 border-dashed bg-white/40 py-5 text-sm font-bold shadow-sm backdrop-blur-sm hover:bg-white/80 active:scale-[0.99] transition-all disabled:opacity-50"
    >
      {label}
    </button>
  );
}
