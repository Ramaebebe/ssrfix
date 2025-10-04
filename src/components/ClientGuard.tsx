"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isDemo } from "@/lib/config";

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  if (isDemo()) return <>{children}</>;

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
