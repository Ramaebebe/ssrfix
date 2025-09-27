"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          console.error(error);
          router.replace(
            "/login?error=" + encodeURIComponent(error.message)
          );
          return;
        }
        router.replace("/client/dashboard");
      } catch (e: any) {
        console.error(e);
        router.replace(
          "/login?error=" + encodeURIComponent(e?.message || "Auth failed")
        );
      }
    };
    run();
  }, [router]);

  return null;
}

