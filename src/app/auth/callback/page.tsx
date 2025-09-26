"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function parseHashFragmentToTokens(hash: string) {
  // hash like: "#access_token=...&expires_at=...&refresh_token=...&token_type=bearer&type=magiclink"
  const out: Record<string, string> = {};
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  for (const pair of trimmed.split("&")) {
    const [k, v] = pair.split("=");
    if (k && v) out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return {
    access_token: out["access_token"],
    refresh_token: out["refresh_token"],
  };
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        // 1) Preferred modern flow: exchange ?code=... for a session (PKCE)
        const { data, error } = await supabase.auth.exchangeCodeForSession();
        if (!error && data?.session) {
          router.replace("/client/dashboard");
          return;
        }

        // 2) Legacy magic link style (like the URL you pasted) — tokens in location.hash
        const { hash, search } = window.location;

        // If no ?code and we DO have a hash, try to setSession manually
        if (!new URLSearchParams(search).get("code") && hash) {
          const { access_token, refresh_token } = parseHashFragmentToTokens(hash);
          if (access_token && refresh_token) {
            const { data: sData, error: sErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sErr) throw sErr;
            if (sData?.session) {
              // clean up the URL so tokens are not left in history
              const cleanUrl = window.location.origin + "/auth/callback";
              window.history.replaceState({}, "", cleanUrl);
              router.replace("/client/dashboard");
              return;
            }
          }
        }

        // 3) Fallback: if a session already exists, go through
        const got = await supabase.auth.getSession();
        if (got.data.session) {
          router.replace("/client/dashboard");
          return;
        }

        // No luck — send user back to login
        router.replace("/login");
      } catch {
        router.replace("/login");
      }
    };

    run();
  }, [router]);

  return <p className="p-6">Signing you in…</p>;
}