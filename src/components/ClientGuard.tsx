"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Fix import: use centralized client
import { supabase } from "@/lib/supabase/client";

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

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

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
