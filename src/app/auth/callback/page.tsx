"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState<string>("Completing sign-in…");

  useEffect(() => {
    const run = async () => {
      // If Supabase appended an error to the hash or query, surface it
      const hashErr = params.get("error_description") || params.get("error");
      if (hashErr) {
        setMsg(`Sign-in error: ${decodeURIComponent(hashErr)}`);
        return;
      }

      // Exchange the code in the URL for a session
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        setMsg(`Sign-in error: ${error.message}`);
        return;
      }

      setMsg("Signed in. Redirecting…");
      // Adjust this to your post-login landing page:
      router.replace("/client");
    };

    // Only run on client
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container-tight py-12">
      <div className="card p-6">
        <div className="text-white">{msg}</div>
        <div className="text-xs text-white/60 mt-2">
          If this page sits for too long, try reloading or request a new magic link.
        </div>
      </div>
    </main>
  );
}
