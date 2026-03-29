"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NETWORK } from "@/hooks/contract";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/components/WalletProvider";

function WalletIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Explore Jobs", href: "/explore" },
  { name: "Post Job", href: "/post" },
];

export default function Navbar() {
  const { walletAddress, connect, disconnect, isConnecting } = useWallet();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const close = () => setShowDropdown(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showDropdown]);

  const handleCopy = useCallback(async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [walletAddress]);

  const truncate = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm"
          : "border-transparent bg-transparent backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo and Links */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 shadow-sm text-white group-hover:bg-indigo-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="7" cy="18" r="2" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              FreelanceHub
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${
                  pathname === link.href ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Badge variant="success" className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {NETWORK}
          </Badge>

          {walletAddress ? (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm transition-all hover:bg-slate-50"
              >
                <div className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                  {walletAddress.slice(0, 2)}
                </div>
                <span className="font-mono text-xs text-slate-700">
                  {truncate(walletAddress)}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`text-slate-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white backdrop-blur-3xl shadow-xl animate-fade-in-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                      Connected Wallet
                    </p>
                    <p className="font-mono text-xs font-semibold text-slate-700 break-all leading-relaxed">
                      {walletAddress}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => { handleCopy(); setShowDropdown(false); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {copied ? <CheckSmallIcon /> : <CopyIcon />}
                      {copied ? "Copied!" : "Copy Address"}
                    </button>
                    <button
                      onClick={() => { disconnect(); setShowDropdown(false); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <PowerIcon />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <WalletIcon size={14} />
                  Connect Wallet
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
