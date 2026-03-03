"use client";

import type { ReactNode } from "react";
import * as DT from "@accelint/design-toolkit";

// Use toolkit provider when available, but keep a no-op fallback for local tests.
const ThemeProvider = (DT as any).ThemeProvider ?? (({ children }: { children: ReactNode }) => children);

export function ThemeShell({ children }: { children: ReactNode }) {
  // Central place to enforce the dark C2 look.
  return <ThemeProvider theme="c2-dark">{children}</ThemeProvider>;
}
