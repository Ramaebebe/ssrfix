"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <main className="container-tight py-12">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSend} className="card p-4 space-y-3">
        <input
          type="email"
          className="input"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn" type="submit">Send magic link</button>
        {sent && (
          <div className="text-sm text-green-400">
            Check your inbox for the sign-in link. Don’t close this tab.
          </div>
        )}
        {err && <div className="text-sm text-red-400">{err}</div>}
      </form>
      <p className="mt-6 text-sm text-white/70">
        Tip: open the email on the **same device & browser** so cookies persist.
      </p>
    </main>
  );
}
