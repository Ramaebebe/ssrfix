"use client";

import "@/app/globals.css";
import React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function Guard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) router.replace("/login");
      else setReady(true);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}

function NavItem({ href, label }: { href: `/${string}`; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={`navlink ${active ? "navlink-active" : ""}`}>
      {label}
    </Link>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard>
      <div className="container-tight py-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        <aside className="card p-3 space-y-1">
          <div className="text-xs uppercase tracking-wider text-white/50 px-2 pb-2">
            Afrirent
          </div>
          <NavItem href="/client/dashboard" label="Dashboard" />
          <NavItem href="/client/quoting" label="Quoting" />
          <NavItem href="/client/reports" label="Reports" />
          <NavItem href="/client/audits" label="Vehicle Audits" />
          <NavItem href="/client/wcp" label="Waste Compactors" />
        </aside>
        <section>{children}</section>
      </div>
    </Guard>
  );
}
