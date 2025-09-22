"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutGrid, Calculator, BarChart3, Wrench, Fuel, Receipt, Car, FileText, Building2, Users, Settings, MonitorPlay } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
const items = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/client/quoting", label: "Quoting", icon: Calculator },
  { href: "/client/reports", label: "Reports", icon: BarChart3 },
  { href: "/client/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/client/fuel", label: "Fuel", icon: Fuel },
  { href: "/client/rebills", label: "Rebills", icon: Receipt },
  { href: "/client/assets", label: "Assets", icon: Car },
  { href: "/client/invoices", label: "Invoices", icon: FileText },
  { href: "/client/entities", label: "Entities", icon: Building2 },
  { href: "/client/users", label: "Users", icon: Users },
  { href: "/client/settings", label: "Settings", icon: Settings },
  { href: "/client/powerbi", label: "Power BI", icon: MonitorPlay },
];
const Sidebar = () => {
  const pathname = usePathname();
  const signOut = async () => { await getSupabaseClient()?.auth.signOut(); window.location.href = "/"; };
  return (
    <nav className="card p-4 sticky top-4">
      {items.map(({href,label,icon:Icon})=>(
        <Link key={href} href={href} className={`navlink flex items-center gap-2 ${pathname===href? "navlink-active":""}`}><Icon size={16}/>{label}</Link>
      ))}
      <button onClick={signOut} className="navlink w-full text-left flex items-center gap-2 mt-2"><LogOut size={16}/> Sign Out</button>
    </nav>
  );
};
export default Sidebar;
