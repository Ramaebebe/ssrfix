// src/app/auth/callback/page.tsx
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function sanitizeRedirect(input: string | null | undefined): string {
  // Only allow internal paths; fallback to dashboard
  if (typeof input === "string" && input.startsWith("/")) return input;
  return "/client/dashboard";
}

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign-in…");

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let alive = true;

    const finish = async () => {
      try {
        // Quick exit if already signed in
        const existing = await supabase.auth.getSession();
        if (existing.data.session) {
          const redirectTo = sanitizeRedirect(searchParams.get("redirect"));
          if (!alive) return;
          setMessage("Already signed in. Redirecting…");
          router.replace(redirectTo as any);
          return;
        }

        // Exchange code/hash for session (works for query or hash magic links)
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          // Fallback: sometimes tokens live purely in the hash and the client consumes them on next tick
          const hash = window.location.hash ?? "";
          if (hash.includes("access_token=") || hash.includes("refresh_token=")) {
            await new Promise((r) => setTimeout(r, 0));
            const after = await supabase.auth.getSession();
            if (!after.data.session) throw error;
          } else {
            throw error;
          }
        }

        const redirectTo = sanitizeRedirect(searchParams.get("redirect"));
        if (!alive) return;
        setMessage("Signed in. Redirecting…");
        router.replace(redirectTo as any);
      } catch (e: any) {
        console.error("[auth/callback] exchange failed:", e);
        if (!alive) return;
        setMessage(
          typeof e?.message === "string"
            ? `Sign-in error: ${e.message}`
            : "Unexpected error during sign-in."
        );
        setTimeout(() => {
          router.replace(
            ("/login?error=" +
              encodeURIComponent(
                typeof e?.message === "string" ? e.message : "unexpected"
              )) as any
          );
        }, 1500);
      }
    };

    finish();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
