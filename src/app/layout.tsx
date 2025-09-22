import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Portal2509", description: "Afrirent client analytics & quoting MVP" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
