import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";
export const metadata: Metadata = { title: "Afrirent Portal", description: "Client analytics & quoting suite" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="mt-28 footer-strip">
          <div className="container-tight flex items-center justify-between py-3">
              <Image src="/brand/afrirent_logo.png" alt="Afrirent" width={120} height={32} className="h-8" />
              <img src="/brand/afrirent_logo.png" alt="Afrirent" className="h-8" />
              <span className="opacity-90 text-sm">A partner on your journey</span>
            </div>
            <span className="text-sm opacity-90">© 2025 Afrirent Mobility</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
