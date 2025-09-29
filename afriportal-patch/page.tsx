"use client";

import ChecklistForm from "@/components/wcp/ChecklistForm";

export default function WcpNewPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Waste Compactor Assessment</h1>
      <ChecklistForm />
    </main>
  );
}