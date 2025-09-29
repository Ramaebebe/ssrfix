"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRBAC } from "@/lib/rbac";
import type { Route } from "next";

const NavItem = ({ href, label }: { href: Route; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return <Link href={href} className={`navlink ${active ? "navlink-active" : ""}`}>{label}</Link>;
};

export default function Sidebar(){
  const { role } = useRBAC();
  return (
    <nav className="card p-3 space-y-1">
      <div className="text-xs uppercase tracking-wider text-white/50 px-2 pb-1">Menu</div>
      <NavItem href={"/client/dashboard"} label="Dashboard" />
      <NavItem href={"/client/quoting"} label="Quoting" />
      <NavItem href={"/client/reports"} label="Reports" />
      {(role==="ops"||role==="admin") && <NavItem href={"/client/audits"} label="Vehicle Audits" />}
      <NavItem href={"/client/wcp"} label="WCP" />
    </nav>
  );
}
