// src/app/login/page.tsx
"use client";

import { useState } from "react";
import getSupabaseClient from "@/lib/supabaseClient";
import Image from "next/image";

export default function LoginPage() {
  const sb = getSupabaseClient();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sendLink = async () => {
    setMsg(null);
    if (!email) return setMsg("Please enter your email.");
    setSending(true);
    try {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setMsg("Check your inbox for the magic link.");
    } catch (e: any) {
      setMsg(e.message || "Failed to send the link.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center relative">
      {/* Hero image */}
      <Image
        src="/login_background.jpg"
        alt=""
        fill
        className="object-cover opacity-40"
        priority
      />
      {/* Overlay card */}
      <div className="relative z-10 card p-6 w-full max-w-md bg-black/60 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <Image src="/afrirent_logo.png" alt="Afrirent" width={36} height={36} />
          <h1 className="text-xl font-semibold">Afrirent Portal</h1>
        </div>
        <p className="text-white/70 text-sm mb-4">
          Sign in with your email to receive a one-time link.
        </p>
        <input
          className="input mb-3"
          type="email"
          placeholder="you@company.co.za"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <button className="btn w-full" onClick={sendLink} disabled={sending}>
          {sending ? "Sending…" : "Send Magic Link"}
        </button>
        {msg && <div className="mt-3 text-sm text-white/80">{msg}</div>}
      </div>
    </main>
  );
}
