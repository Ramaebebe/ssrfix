"use client";

import { useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Build the callback URL once, safely on the client
  const emailRedirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return `${window.location.origin}/auth/callback`;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!supabase) {
      setErr("Supabase not configured.");
      return;
    }
    if (!emailRedirectTo) {
      setErr("Cannot determine callback URL.");
      return;
    }

    // light validation helps avoid obvious typos
    const looksLikeEmail = /\S+@\S+\.\S+/.test(email);
    if (!looksLikeEmail) {
      setErr("Please enter a valid email address.");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo, // always send users to the callback
        },
      });

      if (error) throw error;
      setMsg("Magic link sent. Please check your email to continue.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send magic link.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-black text-white">
      <form onSubmit={handleLogin} className="p-6 card flex flex-col gap-4 w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="input"
          required
          disabled={sending}
        />

        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? "Sending…" : "Send magic link"}
        </button>

        {msg && <p className="text-green-400 text-sm">{msg}</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}

        <p className="text-xs text-white/60">
          We’ll email you a one-time sign-in link. No password needed.
        </p>
      </form>
    </main>
  );
}
