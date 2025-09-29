"use client";

type ChecklistItem = {
  id: string;
  label: string;
  status: "ok" | "fail" | "na";
};

const ChecklistForm = () => {
  const items: ChecklistItem[] = [
    { id: "brakes", label: "Brakes", status: "ok" },
    { id: "lights", label: "Lights", status: "ok" },
  ];
  return (
    <form className="space-y-4">
      {items.map((i) => (
        <div key={i.id} className="flex items-center gap-3">
          <span className="w-40">{i.label}</span>
          <select defaultValue={i.status} className="input">
            <option value="ok">OK</option>
            <option value="fail">Fail</option>
            <option value="na">N/A</option>
          </select>
        </div>
      ))}
    </form>
  );
};
export default ChecklistForm;