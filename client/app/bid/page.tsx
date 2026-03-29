"use client";

import { useState, useCallback } from "react";
import { submitBid } from "@/hooks/contract";
import { useWallet } from "@/components/WalletProvider";

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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

export default function SubmitBidPage() {
  const { walletAddress } = useWallet();
  const [bidJobId, setBidJobId] = useState("");
  const [bidProposal, setBidProposal] = useState("");
  const [bidAskPrice, setBidAskPrice] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const handleSubmitBid = useCallback(async () => {
    if (!walletAddress) return setError("Please connect your wallet first.");
    if (!bidJobId.trim() || !bidProposal.trim() || !bidAskPrice.trim()) return setError("All fields are required.");
    if (isNaN(Number(bidJobId)) || isNaN(Number(bidAskPrice))) return setError("Job ID and Price must be numbers.");
    
    setError(null);
    setIsBidding(true);
    setTxStatus("Awaiting signature...");
    
    try {
      await submitBid(walletAddress, Number(bidJobId), bidProposal.trim(), Math.floor(Number(bidAskPrice) * 10000000));
      setTxStatus("Bid successfully submitted!");
      setBidJobId("");
      setBidProposal("");
      setBidAskPrice("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsBidding(false);
    }
  }, [walletAddress, bidJobId, bidProposal, bidAskPrice]);

  return (
    <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6 py-12 animate-fade-in-up">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Direct Bid</h1>
        <p className="text-slate-500 text-lg">Submit a proposal directly using a known Job ID.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm animate-slide-down">
          <p className="text-sm font-bold text-red-800">Error Encountered</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )}

      {txStatus && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm animate-slide-down">
          <span className="text-sm font-bold text-indigo-800">{txStatus}</span>
          <span className="text-indigo-600">
            {txStatus.includes("successfully") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Target Job ID</label>
            <input
              type="number"
              value={bidJobId}
              onChange={(e) => setBidJobId(e.target.value)}
              placeholder="e.g. 42"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Proposal</label>
            <textarea
              value={bidProposal}
              onChange={(e) => setBidProposal(e.target.value)}
              rows={4}
              placeholder="Pitch your qualifications..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Ask Price (XLM)</label>
            <input
              type="number"
              value={bidAskPrice}
              onChange={(e) => setBidAskPrice(e.target.value)}
              placeholder="e.g. 950"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        <div className="mt-10">
          <button
            onClick={handleSubmitBid}
            disabled={isBidding || !walletAddress}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
          >
            {isBidding ? (
              <><SpinnerIcon /> Confirming...</>
            ) : !walletAddress ? (
              "Connect Wallet to Bid"
            ) : (
              "Submit Bid to Protocol"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
