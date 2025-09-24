"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sb = getSupabaseClient();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        if (!sb) {
          if (mounted) setAuthed(false);
          return;
        }
        const { data } = await sb.auth.getSession();
        if (!mounted) return;
        setAuthed(!!data.session);
      } finally {
        if (mounted) setChecking(false);
      }
    };
    check();
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => { mounted = false; window.removeEventListener("focus", onFocus); };
  }, [pathname, sb]);

  useEffect(() => {
    if (!checking && !authed) {
      router.replace("/login");
    }
  }, [checking, authed, router]);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-white/70">Checking your session…</div>;
  }

  if (!authed) return null;

  return (
    <div className="container-tight">
      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <Sidebar />
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <Topbar />
          <div className="mt-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
