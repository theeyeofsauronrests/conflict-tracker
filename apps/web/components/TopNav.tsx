"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Map View" },
  { href: "/table", label: "Table View" },
  { href: "/docs", label: "Docs" }
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid var(--c2-border)",
        background: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(4px)"
      }}
    >
      <nav style={{ maxWidth: 1400, margin: "0 auto", padding: "10px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <strong style={{ marginRight: 10 }}>Conflict Tracker</strong>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid var(--c2-border)",
                textDecoration: "none",
                color: "var(--c2-text)",
                background: isActive ? "#111111" : "transparent"
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
