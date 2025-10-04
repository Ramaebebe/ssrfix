"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (demo) {
      router.replace("/client/dashboard");
      return;
    }

    // Real Supabase flow (only runs if DEMO_MODE !== true)
    setStatus("sending");
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "/auth/callback";

      const { supabase } = await import("@/lib/supabase/client");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message || "Failed to send magic link.");
      } else {
        setStatus("sent");
        setMessage("Magic link sent. Please check your inbox.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Unexpected error.");
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="card p-6 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-white/70 mb-6">
          {demo ? "Demo mode: Click the button to continue." : "Enter your email and we’ll email you a magic link."}
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          {!demo && (
            <label className="block">
              <span className="text-sm text-white/70">Email</span>
              <input
                type="email"
                required
                className="input mt-1 w-full"
                placeholder="you@company.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}

          <button type="submit" className="btn w-full" disabled={status === "sending"}>
            {demo ? "Enter Portal" : status === "sending" ? "Sending…" : "Send magic link"}
          </button>
        </form>

        {status !== "idle" && !demo && (
          <div className={"mt-4 text-sm " + (status === "error" ? "text-red-400" : "text-white/80")}>
            {message}
          </div>
        )}

        <div className="mt-6 text-xs text-white/50">
          {demo ? "Authentication is bypassed in demo mode." : "By signing in, you agree to our acceptable use policy."}
        </div>
      </div>
    </main>
  );
}
