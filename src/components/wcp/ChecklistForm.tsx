"use client";

export type Status = "Pass" | "Fail" | "N/A";

export type ChecklistItem = {
  category: string;
  field: string;
  status: Status;
  notes?: string;
};

export type ChecklistFormProps = {
  value: ChecklistItem[];
  onChange: (next: ChecklistItem[]) => void;
};

export default function ChecklistForm({ value, onChange }: ChecklistFormProps) {
  const update = (idx: number, patch: Partial<ChecklistItem>) => {
    const next = value.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const addRow = () => onChange([...value, { category: "", field: "", status: "Pass" }]);
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/70">Checklist</div>
        <button className="btn" type="button" onClick={addRow}>Add item</button>
      </div>

      <div className="space-y-3">
        {value.map((row, i) => (
          <div key={i} className="grid md:grid-cols-4 gap-2 items-end">
            <input
              className="input"
              placeholder="Category"
              value={row.category}
              onChange={(e) => update(i, { category: e.target.value })}
            />
            <input
              className="input"
              placeholder="Field"
              value={row.field}
              onChange={(e) => update(i, { field: e.target.value })}
            />
            <select
              className="input"
              value={row.status}
              onChange={(e) => update(i, { status: e.target.value as ChecklistItem["status"] })}
            >
              <option>Pass</option>
              <option>Fail</option>
              <option>N/A</option>
            </select>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Notes (optional)"
                value={row.notes ?? ""}
                onChange={(e) => update(i, { notes: e.target.value })}
              />
              <button className="btn" type="button" onClick={() => remove(i)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
