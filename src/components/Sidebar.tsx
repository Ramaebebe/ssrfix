"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useRBAC } from "@/lib/rbac";

type NavItemProps = {
  href: Route; // typed route (e.g. "/client/dashboard")
  label: string;
};

const NavItem = ({ href, label }: NavItemProps) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={`navlink ${active ? "navlink-active" : ""}`}>
      {label}
    </Link>
  );
};

const Sidebar = () => {
  const { role } = useRBAC();

  return (
    <nav className="card p-3 space-y-1">
      <div className="text-xs uppercase tracking-wider text-white/50 px-2 pb-1">Menu</div>
      <NavItem href={"/client/dashboard"} label="Dashboard" />
      <NavItem href={"/client/quoting"} label="Quoting" />
      <NavItem href={"/client/reports"} label="Reports" />
      {(role === "ops" || role === "admin") && (
        <NavItem href={"/client/audits"} label="Vehicle Audits" />
      )}
    </nav>
  );
};

export default Sidebar;
