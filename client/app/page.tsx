"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { viewHubStats } from "@/hooks/contract";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [hubStats, setHubStats] = useState<Record<string, string> | null>(null);

  const handleFetchStats = useCallback(async () => {
    try {
      const result = await viewHubStats();
      if (result && typeof result === "object") {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(result)) {
          mapped[String(k)] = String(v);
        }
        setHubStats(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    handleFetchStats();
  }, [handleFetchStats]);

  return (
    <main className="relative flex-1 flex flex-col items-center justify-center -mt-10 px-6 animate-fade-in-up">
      {/* Hyper Professional Clean Hero */}
      <div className="max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Decentralized Escrow Active on Soroban
        </div>

        <h1 className="mb-6 text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Trustless Freelance <br />
          <span className="text-indigo-600">Work Coordination.</span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg md:text-xl leading-relaxed text-slate-500 mb-10">
          Post requirements, accept competitive bids, and securely release funds entirely on-chain without trusting any centralized platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/explore" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 text-white font-bold text-base shadow-lg hover:bg-slate-800 transition-all hover:-translate-y-0.5">
            Explore Marketplace
          </Link>
          <Link href="/post" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-base shadow-sm border border-slate-200 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
            Post a Job
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="w-full max-w-5xl mt-24 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Total Jobs Posted", val: hubStats?.total_jobs || "Loading..." },
            { label: "Active Network Bids", val: hubStats?.total_bids || "Loading..." },
            { label: "Successfully Completed", val: hubStats?.total_completed || "Loading..." },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">{stat.label}</div>
              <div className="text-4xl font-extrabold text-slate-900 font-mono">{stat.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Details */}
      <div className="mt-auto pb-8 flex flex-col items-center gap-6">
        <div className="flex items-center gap-8 justify-center flex-wrap">
          {[
             { name: "Post Job", color: "bg-indigo-500" },
             { name: "Await Bids", color: "bg-amber-500" },
             { name: "Assign Escrow", color: "bg-cyan-500" },
             { name: "Complete Work", color: "bg-emerald-500" }
          ].map((step, i) => (
            <div key={step.name} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${step.color}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{step.name}</span>
              {i < 3 && <span className="ml-6 h-px w-6 bg-slate-200" />}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
