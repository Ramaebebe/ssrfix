// src/components/ClientGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    };

    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // re-check whenever auth state changes
      void check();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
