"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Inspection = {
  id: string;
  reg: string;
  odometer: number | null;
  condition: string;
  issues: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  photo_count?: number;
};

export default function AuditsPage() {
  const [rows, setRows] = useState<Inspection[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("audit_inspections").select("*").limit(100);
      if (data) setRows(data as Inspection[]);
    };
    load();
  }, []);

  return (
    <div ref={tableRef} className="card p-4">
      <h1 className="text-2xl font-bold mb-4">Audits</h1>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left">Reg</th>
            <th className="p-2 text-right">Odo</th>
            <th className="p-2">Condition</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="p-2">{r.reg}</td>
              <td className="p-2 text-right">{r.odometer ?? "-"}</td>
              <td className="p-2">{r.condition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}