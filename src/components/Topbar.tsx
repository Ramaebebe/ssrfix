"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Always take the user back to login
      window.location.href = "/login";
    }
  };

  return (
    <header className="w-full border-b border-white/10 bg-black/30 backdrop-blur supports-[backdrop-filter]:bg-black/30">
      <div className="container-tight h-14 flex items-center gap-3">
        <Link href="/client/dashboard" className="flex items-center gap-2">
          <Image src="/brand/afrirent_logo.png" alt="Afrirent" width={28} height={28} />
          <span className="font-semibold">Afrirent Portal</span>
        </Link>

        <nav className="ml-auto hidden md:flex items-center gap-4">
          <Link className="navlink" href="/client/dashboard">Dashboard</Link>
          <Link className="navlink" href="/client/quoting">Quoting</Link>
          <Link className="navlink" href="/client/reports">Reports</Link>
          <Link className="navlink" href="/client/wcp">WCP</Link>
          <button className="btn btn-ghost" onClick={signOut}>Sign out</button>
        </nav>

        {/* mobile */}
        <button
          className="md:hidden ml-auto btn btn-ghost"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          ☰
        </button>
        {menuOpen && (
          <div className="absolute right-3 top-14 z-50 w-48 rounded-xl border border-white/10 bg-zinc-900 p-2 md:hidden">
            <Link className="block px-3 py-2 hover:bg-white/5 rounded-lg" href="/client/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link className="block px-3 py-2 hover:bg-white/5 rounded-lg" href="/client/quoting" onClick={() => setMenuOpen(false)}>Quoting</Link>
            <Link className="block px-3 py-2 hover:bg-white/5 rounded-lg" href="/client/reports" onClick={() => setMenuOpen(false)}>Reports</Link>
            <Link className="block px-3 py-2 hover:bg-white/5 rounded-lg" href="/client/wcp" onClick={() => setMenuOpen(false)}>WCP</Link>
            <button className="block w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg" onClick={signOut}>Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}
