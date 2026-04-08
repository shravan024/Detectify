"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User as UserIcon, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Hide the Navbar entirely on the login and register pages, 
  // as they have their own split-screen branding.
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav className="w-full px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center backdrop-blur-xl bg-[#030712]/80 border-b border-white/5 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <span className="text-base sm:text-lg font-bold text-white tracking-tight font-space-grotesk truncate">Detectify</span>
      </Link>

      <div className="flex items-center gap-4">
        {status === "loading" ? (
          <div className="w-24 h-9 bg-white/5 animate-pulse rounded-full border border-white/5" />
        ) : session ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <UserIcon size={12} className="text-white" />
              </div>
              <span className="hidden sm:inline text-white/90 font-medium tracking-wide text-xs">{session.user?.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm font-medium border border-white/5 text-white/70 hover:text-white"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link 
              href="/login" 
              className="text-xs sm:text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/register" 
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-white text-black hover:bg-white/90 transition-all text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
