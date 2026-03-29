"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { 
  viewHubStats, 
  viewJob, 
  submitBid,
  completeJob
} from "@/hooks/contract";
import { useWallet } from "@/components/WalletProvider";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { dot: string; variant: "success" | "warning" | "info" }> = {
  Open: { dot: "bg-amber-500", variant: "warning" },
  Assigned: { dot: "bg-cyan-500", variant: "info" },
  Completed: { dot: "bg-emerald-500", variant: "success" },
};

export default function ExploreJobsPage() {
  const { walletAddress } = useWallet();
  const [allJobs, setAllJobs] = useState<{id: string, data: Record<string, string>}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadAllJobs = useCallback(async () => {
    setIsLoading(true);
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
        setAllJobs(jobsList.reverse()); // Show newest first
      }
    } catch (err: unknown) {
      setError("Failed to load all jobs from network.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleLoadAllJobs();
  }, [handleLoadAllJobs]);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Explore Jobs</h1>
          <p className="text-slate-500 text-lg">Browse active opportunities and submit your proposals on-chain.</p>
        </div>
        <button
          onClick={handleLoadAllJobs}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          )}
          Refresh Feed
        </button>
      </div>

      {error && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-red-800">Error</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )}

      {allJobs.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200 bg-white">
          <p className="text-slate-400 font-semibold mb-2">No jobs found on the network.</p>
          <p className="text-sm text-slate-400">Be the first to post a job!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allJobs.map((job) => (
             <JobCard 
               key={job.id} 
               data={job.data} 
               jobId={job.id} 
               walletAddress={walletAddress}
               refreshJobs={handleLoadAllJobs}
             />
          ))}
        </div>
      )}
    </main>
  );
}

function JobCard({ data, jobId, walletAddress, refreshJobs }: any) {
  const [proposal, setProposal] = useState("");
  const [askPrice, setAskPrice] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [bidTx, setBidTx] = useState<string | null>(null);

  const [isCompleting, setIsCompleting] = useState(false);

  const handleInlineBid = async () => {
    if (!walletAddress || !proposal.trim() || !askPrice.trim()) return;
    setIsBidding(true);
    setBidTx("Confirming...");
    try {
      await submitBid(walletAddress, Number(jobId), proposal.trim(), Math.floor(Number(askPrice) * 10000000));
      setBidTx("Bid placed!");
      setProposal("");
      setAskPrice("");
      setTimeout(() => setBidTx(null), 3000);
      refreshJobs();
    } catch {
      setBidTx("Failed.");
      setTimeout(() => setBidTx(null), 3000);
    } finally {
      setIsBidding(false);
    }
  };

  const handleComplete = async () => {
    if (!walletAddress) return;
    setIsCompleting(true);
    try {
      await completeJob(walletAddress, Number(jobId));
      refreshJobs();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-4">
          <Badge variant={STATUS_CONFIG[data.status]?.variant || "info"} className="px-3 py-1 font-bold tracking-wider text-[10px] uppercase shadow-sm">
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${STATUS_CONFIG[data.status]?.dot || "bg-slate-400"}`} />
            {data.status}
          </Badge>
          <span className="text-xs font-mono font-bold text-slate-400">ID: {jobId}</span>
        </div>
        
        <h5 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
          {data.title || "Untitled Job"}
        </h5>
        <div className="text-sm font-medium text-slate-600 leading-relaxed max-h-24 overflow-y-auto pr-2">
          {data.description || "No description provided."}
        </div>
      </div>
      
      {/* Metadata */}
      <div className="p-6 flex-1">
        <div className="flex flex-col gap-3">
          {Object.entries(data).map(([key, val]: any) => {
            if (["title", "description", "status"].includes(key)) return null;
            return (
               <div key={key} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key.replace("_", " ")}</span>
                 <span className="font-mono text-sm font-bold text-slate-800 truncate">
                   {key === "budget" ? `${(Number(val) / 10000000).toLocaleString()} XLM` : val}
                 </span>
               </div>
            )
          })}
        </div>
      </div>

      {/* Action Area */}
      {data.status === "Open" && (
        <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">Submit Bid Form</p>
            <div className="space-y-3">
              <input 
                value={proposal} 
                onChange={e => setProposal(e.target.value)} 
                placeholder="Your proposal..." 
                className="w-full text-sm font-medium bg-white border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={askPrice} 
                  onChange={e => setAskPrice(e.target.value)} 
                  placeholder="Ask (XLM)" 
                  className="w-full text-sm font-mono bg-white border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                />
                <button 
                  onClick={handleInlineBid} 
                  disabled={isBidding || !walletAddress || !proposal || !askPrice} 
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-900 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {bidTx || "Bid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 py-4 bg-white border-t border-slate-100 flex gap-2">
        <Link 
          href={`/job/${jobId}/bids`}
          className="flex-1 text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded-xl transition-all shadow-sm"
        >
          View Bids
        </Link>

        {data.status === "Assigned" && (
          <button
            onClick={handleComplete}
            disabled={!walletAddress || isCompleting}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-xs font-bold uppercase tracking-wide rounded-xl transition-all shadow-md"
          >
            Complete Job
          </button>
        )}
      </div>

    </div>
  );
}
