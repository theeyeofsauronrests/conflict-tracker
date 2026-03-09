"use client";

import React from "react";
import * as DT from "@accelint/design-toolkit";

export const Icon =
  ((DT as any).Icon as React.ComponentType<{ children?: React.ReactNode }>) ??
  (({ children }: { children?: React.ReactNode }) => <span>{children}</span>);

export const Button =
  ((DT as any).Button as React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>) ??
  ((props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />);

export const Badge =
  ((DT as any).Badge as React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>) ??
  ((props: React.HTMLAttributes<HTMLSpanElement>) => <span {...props} />);

export const Input =
  ((DT as any).Input as React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>) ??
  ((props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />);

export const Checkbox =
  ((DT as any).Checkbox as React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>) ??
  ((props: React.InputHTMLAttributes<HTMLInputElement>) => <input type="checkbox" {...props} />);

export const ThemeProvider =
  ((DT as any).ThemeProvider as React.ComponentType<{ children: React.ReactNode; theme?: string }>) ??
  (({ children }: { children: React.ReactNode }) => <>{children}</>);

export const Tabs =
  ((DT as any).Tabs as React.ComponentType<Record<string, unknown>>) ??
  (({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>);

export const TabList =
  ((DT as any).TabList as React.ComponentType<Record<string, unknown>>) ??
  (({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>);

export const Tab =
  ((DT as any).Tab as React.ComponentType<Record<string, unknown>>) ??
  (({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <button {...props}>{children}</button>);

export const Table =
  ((DT as any).Table as React.ComponentType<Record<string, unknown>>) ??
  (({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <table {...props}>{children}</table>);

export const DrawerPanel =
  ((DT as any).DrawerPanel as React.ComponentType<Record<string, unknown>>) ??
  (({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>);
