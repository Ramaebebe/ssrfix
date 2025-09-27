"use client";
import { useState } from "react";

type Item = { category: string; item: string; status: string; notes?: string };

type Props = {
  value: Item[];
  onChange: (items: Item[]) => void;
};

const DEFAULT_ITEMS: Item[] = [
  { category: "Exterior",   item: "Lights",        status: "Pass" },
  { category: "Hydraulics", item: "Fluid Levels",  status: "Pass" },
  { category: "Compaction", item: "Packer Plate",  status: "Pass" },
];

export default function ChecklistForm({ value, onChange }: Props) {
  const [items, setItems] = useState<Item[]>(value.length ? value : DEFAULT_ITEMS);

  const update = (idx: number, key: keyof Item, val: string) => {
    const next = [...items];
    (next[idx] as any)[key] = val;
    setItems(next);
    onChange(next);
  };

  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-lg font-semibold">Checklist</h2>
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 items-center">
          <div>{it.item}</div>
          <select className="input" value={it.status} onChange={(e)=>update(i,"status",e.target.value)}>
            <option>Pass</option>
            <option>Fail</option>
          </select>
          <input
            className="input"
            placeholder="Notes"
            value={it.notes || ""}
            onChange={(e)=>update(i,"notes",e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
