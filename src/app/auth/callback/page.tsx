"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error(error);
          router.replace("/login?error=" + encodeURIComponent(error.message));
          return;
        }
        router.replace("/client/dashboard");
      } catch (e: any) {
        router.replace("/login?error=" + encodeURIComponent(e?.message ?? "Auth error"));
      }
    };
    run();
  }, [router]);

  return <div className="container-tight p-8">Signing you in…</div>;
}
