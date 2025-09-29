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
        // Handle error from query string (expired/invalid link)
        const errParam = searchParams.get("error");
        const errDesc = searchParams.get("error_description");
        if (errParam) {
          setMessage(`Sign-in error: ${decodeURIComponent(errDesc || errParam)}`);
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }

        // Try to exchange the current URL for a session (handles hash or query)
        const { error } = await supabase.auth.exchangeCodeForSession(
          typeof window !== "undefined" ? window.location.href : ""
        );
        if (error) {
          if (!alive) return;
          setMessage(`Sign-in error: ${error.message}`);
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }

        // Optional redirect param
        const redirectTo = searchParams.get("redirect") || "/client/dashboard";
        if (!alive) return;
        setMessage("Signed in. Redirecting…");
        router.replace(redirectTo as string);
      } catch {
        if (!alive) return;
        setMessage("Unexpected error during sign-in.");
        setTimeout(() => router.replace("/login"), 1500);
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
