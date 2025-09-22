"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
const Sidebar = () => {
  const pathname = usePathname();
  const signOut = async () => { await getSupabaseClient()?.auth.signOut(); window.location.href = "/"; };
  return (
    <nav className="card p-4 sticky top-4">
      <Link href="/client/dashboard" className={`navlink ${pathname==="/client/dashboard" ? "navlink-active" : ""}`}>Dashboard</Link>
      <Link href="/client/quoting" className={`navlink ${pathname==="/client/quoting" ? "navlink-active" : ""}`}>Quoting</Link>
      <button onClick={signOut} className="navlink w-full text-left flex items-center gap-2"><LogOut size={16}/> Sign Out</button>
    </nav>
  );
};
export default Sidebar;
