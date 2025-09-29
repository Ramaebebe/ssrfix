// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="card p-8 max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold">Afrirent Portal</h1>
        <p className="text-white/70">Welcome. Choose an action to continue.</p>
        <div className="flex flex-col gap-3">
          <Link href="/login" className="btn">
            Sign in
          </Link>
          <Link href="/client/dashboard" className="btn">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
