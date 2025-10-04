import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Afrirent Portal",
  description: "Fleet operations, quoting, audits, and analytics",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0B1020] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
