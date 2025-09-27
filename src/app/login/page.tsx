"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [err, setErr] = useState("");

  const sendMagic = async () => {
    setState("sending"); setErr("");
    const redirectTo = `${location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) { setErr(error.message); setState("error"); }
    else setState("sent");
  };

  return (
    <main className="container-tight py-10">
      <div className="card p-6 max-w-md">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <input
          className="input mb-3"
          placeholder="you@company.com"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <button className="btn w-full" onClick={sendMagic} disabled={!email || state==="sending"}>
          {state==="sending" ? "Sending…" : "Send magic link"}
        </button>
        {state==="sent" && (
          <p className="text-sm text-white/70 mt-3">
            Check your inbox and use the link within 5–10 minutes. Keep this tab open; you’ll be redirected after sign-in.
          </p>
        )}
        {state==="error" && <p className="text-sm text-red-400 mt-3">{err}</p>}
      </div>
    </main>
  );
}
