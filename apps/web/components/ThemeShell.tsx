"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/ui";

export function ThemeShell({ children }: { children: ReactNode }) {
  // Central place to enforce the dark C2 look.
  return <ThemeProvider theme="c2-dark">{children}</ThemeProvider>;
}
