"use client";

import { usePathname, useRouter } from "next/navigation";
import { Target as TargetIcon } from "@accelint/icons";
import { Badge, Icon, Tab, TabList, Tabs } from "@/lib/ui";

const NAV_ITEMS = [
  { href: "/", label: "Map View" },
  { href: "/table", label: "Table View" },
  { href: "/docs", label: "Docs" }
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="c2-topnav">
      <nav className="c2-topnav-inner">
        <div className="c2-brand-block">
          <strong className="c2-brand-title c2-brand-title-row">
            <span className="c2-brand-icon" aria-hidden>
              <Icon>
                <TargetIcon width={14} height={14} />
              </Icon>
            </span>
            <span>Conflict Tracker</span>
          </strong>
          <span className="c2-brand-subtitle">Operational Display</span>
        </div>
        <Tabs
          selectedKey={pathname}
          onSelectionChange={(key: unknown) => {
            if (typeof key === "string") {
              router.push(key);
            }
          }}
          orientation="horizontal"
          align="start"
          flex={false}
        >
          <TabList className="c2-nav-tabs">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Tab
                  key={item.href}
                  id={item.href}
                  className={`c2-nav-tab ${isActive ? "is-active" : ""}`}
                >
                  {item.label}
                </Tab>
              );
            })}
          </TabList>
        </Tabs>
        <div className="c2-topnav-actions">
          <Badge className="c2-top-badge">Public OSINT</Badge>
          <Badge className="c2-top-badge">+6h delayed</Badge>
        </div>
      </nav>
    </header>
  );
}
