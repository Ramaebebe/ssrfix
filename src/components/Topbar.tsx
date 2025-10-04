"use client";

import Image from "next/image";
import Link from "next/link";

export default function Topbar() {
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-black/30 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo.svg" alt="Afrirent" width={120} height={30} priority />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {demo && (
            <span className="px-2 py-1 text-xs rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              DEMO MODE
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
