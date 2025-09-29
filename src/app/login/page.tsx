// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("sending");
    setMessage("");

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const redirectTo = `${origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message || "Failed to send magic link.");
        return;
      }

      setStatus("sent");
      setMessage("Magic link sent. Please check your inbox.");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Unexpected error.";
      setStatus("error");
      setMessage(msg);
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="card p-6 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-white/70 mb-6">
          Enter your email and we’ll email you a magic link.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
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

          <button type="submit" className="btn w-full" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
        </form>

        {status !== "idle" && (
          <div
            className={
              "mt-4 text-sm " + (status === "error" ? "text-red-400" : "text-white/80")
            }
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-xs text-white/50">
          By signing in, you agree to our acceptable use policy.
        </div>
      </div>
    </main>
  );
}
