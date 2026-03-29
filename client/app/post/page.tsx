"use client";

import { useState, useCallback, useEffect } from "react";
import { postJob } from "@/hooks/contract";
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

export default function PostJobPage() {
  const { walletAddress } = useWallet();
  const [postTitle, setPostTitle] = useState("");
  const [postDesc, setPostDesc] = useState("");
  const [postBudget, setPostBudget] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const handlePostJob = useCallback(async () => {
    if (!walletAddress) return setError("Please connect your wallet first.");
    if (!postTitle.trim() || !postDesc.trim() || !postBudget.trim()) return setError("All fields are required.");
    if (isNaN(Number(postBudget))) return setError("Budget must be a valid number.");
    
    setError(null);
    setIsPosting(true);
    setTxStatus("Awaiting signature...");
    
    try {
      await postJob(walletAddress, postTitle.trim(), postDesc.trim(), Math.floor(Number(postBudget) * 10000000));
      setTxStatus("Job successfully posted to the Soroban network!");
      setPostTitle("");
      setPostDesc("");
      setPostBudget("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsPosting(false);
    }
  }, [walletAddress, postTitle, postDesc, postBudget]);

  return (
    <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6 py-12 animate-fade-in-up">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Post a Job</h1>
        <p className="text-slate-500 text-lg">Define the scope, set the budget, and let the market compete.</p>
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
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Job Title</label>
            <input
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="e.g. Smart Contract Auditor"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Description / Requirements</label>
            <textarea
              value={postDesc}
              onChange={(e) => setPostDesc(e.target.value)}
              rows={4}
              placeholder="Describe what needs to be delivered..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Budget (XLM)</label>
            <input
              type="number"
              value={postBudget}
              onChange={(e) => setPostBudget(e.target.value)}
              placeholder="e.g. 500"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        <div className="mt-10">
          <button
            onClick={handlePostJob}
            disabled={isPosting || !walletAddress}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
          >
            {isPosting ? (
              <><SpinnerIcon /> Confirming...</>
            ) : !walletAddress ? (
              "Connect Wallet to Post Job"
            ) : (
              "Publish Job to Blockchain"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
