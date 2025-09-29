"use client";

type Props = { onScan: (code: string) => void };

export default function Scanner({ onScan }: Props) {
  return (
    <button className="btn" onClick={() => onScan("TEST123")}>
      Simulate Scan
    </button>
  );
}