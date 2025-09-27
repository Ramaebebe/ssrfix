"use client";
import React, { createContext, useContext, useState } from "react";

export type Role = "admin" | "ops" | "client_user";

type RBACValue = {
  role: Role;
  setRole: (r: Role) => void;
};

const RBACContext = createContext<RBACValue | undefined>(undefined);

export const RBACProvider: React.FC<{ initialRole?: Role; children: React.ReactNode }> = ({
  initialRole = "client_user",
  children,
}) => {
  const [role, setRole] = useState<Role>(initialRole);
  return <RBACContext.Provider value={{ role, setRole }}>{children}</RBACContext.Provider>;
};

export const useRBAC = () => {
  const ctx = useContext(RBACContext);
  if (!ctx) throw new Error("useRBAC must be used within RBACProvider");
  return ctx;
};

export const inferRoleFromEmail = (email?: string | null): Role => {
  if (!email) return "client_user";
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (domain === "afrirent.co.za") return "ops";
  return "client_user";
};

