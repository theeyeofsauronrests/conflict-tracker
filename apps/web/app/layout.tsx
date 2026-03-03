import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeShell } from "@/components/ThemeShell";

export const metadata: Metadata = {
  title: "Conflict Tracker",
  description: "OSINT conflict visualization with 6-hour delayed public feeds"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeShell>{children}</ThemeShell>
      </body>
    </html>
  );
}
