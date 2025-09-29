"use client";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Topbar(){
  const router=useRouter();
  const logout=async()=>{ await supabase.auth.signOut(); router.replace("/login"); };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src="/brand/afrirent_logo.png" width={32} height={32} alt="logo"/>
        <div className="font-semibold">Afrirent Portal</div>
      </div>
      <button className="navlink" onClick={logout}>Sign out</button>
    </div>
  );
}
