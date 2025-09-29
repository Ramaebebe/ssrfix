"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";
type Role="user"|"ops"|"admin";
export function useRBAC(){
  const [role,setRole]=useState<Role>("user");
  useEffect(()=>{
    (async ()=>{
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("portal.profiles").select("role").eq("user_id",user.id).maybeSingle();
      if (data?.role) setRole(data.role as Role);
    })();
  },[]);
  return { role };
}
