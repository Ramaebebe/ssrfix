// src/app/auth/callback/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let alive = true;

    const finish = async () => {
      try {
        // Supabase magic link supports both query-string and hash fragments.
        // Using the current URL avoids chasing specific params.
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          console.error(error);
          if (!alive) return;
          setMessage(`Sign-in error: ${error.message}`);
          // Optional: send back to login after a short delay
          setTimeout(() => router.replace("/login?error=" + encodeURIComponent(error.message)), 1500);
          return;
        }

        // Optional: honor a "redirect" param (e.g. /auth/callback?redirect=/client/dashboard)
        const redirectTo = searchParams.get("redirect") || "/client/dashboard";
        if (!alive) return;
        setMessage("Signed in. Redirecting…");
        router.replace(redirectTo);
      } catch (e: any) {
        console.error(e);
        if (!alive) return;
        setMessage("Unexpected error during sign-in.");
        setTimeout(() => router.replace("/login?error=unexpected"), 1500);
      }
    };

    finish();
    return () => {
      alive = false;
    };
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
            <p className="text-white/70">Preparing…</p>
          </div>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
