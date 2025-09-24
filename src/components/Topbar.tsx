"use client";

import Image from "next/image";
import { getSupabaseClient } from "@/lib/supabaseClient";

const Topbar = () => {
  const sb = getSupabaseClient();

  const signOut = async () => {
    if (!sb) {
      console.warn("Supabase not configured; redirecting to home.");
      window.location.href = "/";
      return;
    }
    await sb.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="card px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src="/logo.svg" alt="Logo" width={32} height={32} />
        <span className="font-semibold">Afrirent Portal</span>
      </div>
      <div className="text-sm text-white/70">Welcome, User</div>
      <button className="navlink" onClick={signOut}>
        Sign out
      </button>
    </header>
  );
};

export default Topbar;
