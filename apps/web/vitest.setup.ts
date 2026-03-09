import "@testing-library/jest-dom/vitest";
import React, { type ReactNode } from "react";
import { vi } from "vitest";

vi.mock("@accelint/design-toolkit", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => React.createElement(React.Fragment, null, children),
  Icon: ({ children }: { children: ReactNode }) => React.createElement("span", null, children),
  Button: ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) =>
    React.createElement("button", props, children),
  Badge: ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement("span", props, children),
  Tabs: ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement("div", props, children),
  TabList: ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement("div", props, children),
  Tab: ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement("button", props, children),
  Table: ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement("table", props, children),
  DrawerPanel: ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement("div", props, children),
  Input: (props: Record<string, unknown>) => React.createElement("input", props),
  Checkbox: (props: Record<string, unknown>) => React.createElement("input", props)
}));
