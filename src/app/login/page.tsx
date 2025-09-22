"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
const getBaseUrl = () => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || (typeof window!=="undefined" ? window.location.origin : "");
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const redirectTo = `${getBaseUrl()}/client/dashboard`;
    const { error } = await (getSupabaseClient()?.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo }}) ?? Promise.resolve({ error: { message: "Supabase not configured" } as any }));
    if (error) setError(error.message); else setSent(true);
  };
  return (
    <main className="min-h-screen relative">
      <img src="/login_background.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative container-tight max-w-md flex items-center justify-center min-h-screen">
        <form onSubmit={onSubmit} className="card p-6 w-full">
          <div className="flex items-center gap-3 mb-4">
            <img src="/afrirent_logo.png" alt="Afrirent" width={40} height={40} />
            <h1 className="text-2xl font-bold">Sign in</h1>
          </div>
          <p className="text-white/70 mb-4">Magic link to your email</p>
          <input className="input mb-3" type="email" placeholder="name@company.com" value={email} onChange={(e)=> setEmail(e.target.value)} required />
          <button className="btn w-full" type="submit">Send magic link</button>
          {sent && <p className="mt-3 text-green-400">Check your inbox for the sign-in link.</p>}
          {error && <p className="mt-3 text-red-400">{error}</p>}
        </form>
      </div>
    </main>
  );
}
