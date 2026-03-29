import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white mt-auto py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 shadow-sm text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="7" cy="18" r="2" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              FreelanceHub
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            &copy; {new Date().getFullYear()} On-Chain Freelancer Escrow
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col gap-2 relative">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Platform</p>
            <Link href="/explore" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Explore Jobs</Link>
            <Link href="/post" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Post a Job</Link>
          </div>
          
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resources</p>
            <a href="https://soroban.stellar.org/docs" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Soroban Docs</a>
            <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Freighter Wallet</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
