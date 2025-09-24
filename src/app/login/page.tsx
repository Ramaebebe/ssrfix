"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const supabase = getSupabaseClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert("Supabase not configured.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/client/dashboard`,
      },
    });

    if (error) alert(error.message);
    else alert("Check your email for a sign-in link!");
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-black text-white">
      <form onSubmit={handleLogin} className="p-6 card flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="input"
          required
        />
        <button type="submit" className="btn-primary">
          Send magic link
        </button>
      </form>
    </main>
  );
}
