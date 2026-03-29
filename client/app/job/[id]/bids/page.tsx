"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  viewHubStats, 
  viewBid,
  acceptBid
} from "@/hooks/contract";
import { useWallet } from "@/components/WalletProvider";
import { Badge } from "@/components/ui/badge";

export default function JobBidsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { walletAddress } = useWallet();
  const [jobBids, setJobBids] = useState<{id: string, data: Record<string, string>}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleLoadBids = useCallback(async () => {
    setIsLoading(true);
    setJobBids([]);
    setError(null);
    try {
      const stats = await viewHubStats();
      if (stats && typeof stats === "object" && stats.total_bids) {
        const total = Number(stats.total_bids);
        const bidsList: {id: string, data: Record<string, string>}[] = [];
        
        for (let i = 1; i <= total; i++) {
          try {
            const bidData = await viewBid(i);
            if (bidData && typeof bidData === "object") {
              // Ensure this bid belongs to the current job
              if (String(bidData.job_id) === String(id)) {
                const mapped: Record<string, string> = {};
                for (const [k, v] of Object.entries(bidData)) mapped[String(k)] = String(v);
                bidsList.push({ id: String(i), data: mapped });
              }
            }
          } catch (e) {
             console.warn("Could not load bid", i, e);
          }
        }
        
        // Sort bids in increasing order of ask_price
        bidsList.sort((a, b) => Number(a.data.ask_price) - Number(b.data.ask_price));
        setJobBids(bidsList);
      }
    } catch (err: unknown) {
      setError("Failed to load bids from network.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      handleLoadBids();
    }
  }, [id, handleLoadBids]);

  const handleAcceptBid = async (bidId: string) => {
    if (!walletAddress) return;
    setAcceptingId(bidId);
    try {
      await acceptBid(walletAddress, Number(id), Number(bidId));
      handleLoadBids();
      router.push("/explore");
    } catch (e: any) {
      setError(e.message || "Failed to accept bid.");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-28 pb-12 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
        <div>
          <button onClick={() => router.push("/explore")} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-2 flex items-center gap-1">
             &larr; Back to Explore
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Bids for Job #{id}</h1>
          <p className="text-slate-500 text-lg">Compare proposals and accept the most competitive bid.</p>
        </div>
        <button
          onClick={handleLoadBids}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-red-800">Error</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )}

      {jobBids.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200 bg-white">
          <p className="text-slate-400 font-semibold mb-2">No bids exist for this job yet.</p>
          <p className="text-sm text-slate-400">Waiting for freelancers to respond.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobBids.map((bid) => (
             <div key={bid.id} className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <Badge variant="info" className="px-3 py-1 font-bold tracking-wider text-[10px] uppercase shadow-sm">
                   Bid #{bid.id}
                 </Badge>
                 <span className="text-xs font-mono font-bold text-slate-400">
                   {bid.data.accepted === "true" ? "✅ ACCEPTED" : "Pending"}
                 </span>
               </div>
               
               <div className="p-6 flex-1 space-y-4">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Freelancer Proposal</p>
                   <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                     {bid.data.proposal}
                   </p>
                 </div>
                 
                 <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ask Price (XLM)</p>
                   <span className="text-xl font-mono font-extrabold text-indigo-600">
                     {(Number(bid.data.ask_price) / 10000000).toLocaleString()}
                   </span>
                 </div>
               </div>

               <div className="p-5 bg-white border-t border-slate-100 mt-auto">
                 <button
                   onClick={() => handleAcceptBid(bid.id)}
                   disabled={!walletAddress || acceptingId === bid.id || bid.data.accepted === "true"}
                   className="w-full py-3 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-sm font-bold uppercase tracking-wide rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                 >
                   {acceptingId === bid.id ? (
                     "Accepting via Ledger..."
                   ) : bid.data.accepted === "true" ? (
                     "Already Accepted"
                   ) : (
                     "Accept This Bid"
                   )}
                 </button>
               </div>
             </div>
          ))}
        </div>
      )}
    </main>
  );
}
