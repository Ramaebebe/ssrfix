"use client";
import { useEffect, useState } from "react";
import supabaseClient from "@/lib/supabaseClient";
import { RBACProvider, inferRoleFromEmail } from "@/lib/rbac";

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      // Store an inferred role so downstream UI can tailor menus/visibility
      const role = inferRoleFromEmail(session.user.email);
      sessionStorage.setItem("afp.role", role);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-white/70">Checking your session…</div>
      </div>
    );
  }

  // Wrap children so they can read role via context if desired
  const role = (sessionStorage.getItem("afp.role") as any) || "client_user";
  return <RBACProvider initialRole={role}>{children}</RBACProvider>;
}
