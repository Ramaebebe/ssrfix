"use client";

import Image from "next/image";
import Link from "next/link";
// import anything else you actually use...

export default function Topbar() {
  return (
    <header className="h-12 px-4 flex items-center justify-between border-b border-white/10">
      <Link href="/client" className="flex items-center gap-2">
        <Image src="/brand/afrirent_logo.png" alt="Afrirent" width={24} height={24} />
        <span className="font-semibold">Afrirent Portal</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/client/dashboard" className="hover:underline">Dashboard</Link>
        <Link href="/client/quoting" className="hover:underline">Quoting</Link>
        <Link href="/client/wcp" className="hover:underline">WCP</Link>
      </nav>
    </header>
  );
}
