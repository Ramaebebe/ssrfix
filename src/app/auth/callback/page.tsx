/* src/app/auth/callback/page.tsx */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isDemo } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-inâ€¦");

  useEffect(() => {
    let alive = true;

    const finish = async () => {
      if (isDemo()) {
        setMessage("Demo mode â€” redirectingâ€¦");
        router.replace("/client/dashboard");
        return;
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          if (!alive) return;
          setMessage(`Sign-in error: ${error.message}`);
          setTimeout(() => router.replace("/login?error=" + encodeURIComponent(error.message)), 1500);
          return;
        }
        const redirectTo = (searchParams.get("redirect") || "/client/dashboard") as string;
        if (!alive) return;
        setMessage("Signed in. Redirectingâ€¦");
        router.replace(redirectTo);
      } catch (_e) {
        if (!alive) return;
        setMessage("Unexpected error during sign-in.");
        setTimeout(() => router.replace("/login?error=unexpected"), 1500);
      }
    };

    finish();
    return () => { alive = false; };
  }, [router, searchParams]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="card p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Authenticating</h1>
        <p className="text-white/70">{message}</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="card p-6 text-center">
            <h1 className="text-xl font-semibold mb-2">Authenticating</h1>
            <p className="text-white/70">Preparingâ€¦</p>
          </div>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
