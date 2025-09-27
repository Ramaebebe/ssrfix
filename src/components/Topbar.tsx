"use client";

import Image from "next/image";
import supabase from "@/lib/supabaseClient";

const Topbar = () => {
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="card px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src="/logo.svg" alt="Logo" width={32} height={32} />
        <span className="font-semibold">Afrirent Portal</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/70">Welcome</span>
        <button className="navlink" onClick={signOut}>Sign out</button>
      </div>
    </header>
  );
};

export default Topbar;
