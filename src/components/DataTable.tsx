// src/components/DataTable.tsx
type Column<T> = {
  key: keyof T;
  header: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
};

export default function DataTable<T extends { id: string | number }>({
  rows, columns,
}: { rows: T[]; columns: Column<T>[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-white/70">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className={`p-2 text-${c.align ?? "left"}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-t border-white/10">
              {columns.map((c) => (
                <td key={String(c.key)} className={`p-2 text-${c.align ?? "left"}`}>
                  {c.render ? c.render(r) : String(r[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
