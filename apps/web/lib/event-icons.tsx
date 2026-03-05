"use client";

import type { Event } from "@conflict-tracker/data-model";
import * as Icons from "@accelint/icons";

export type EventVisualType = "missile" | "drone" | "intercept" | "unknown";

export function getEventVisualType(event: Event): EventVisualType {
  const text = event.rawText.toLowerCase();
  if (event.eventType === "intercept") {
    return "intercept";
  }
  if (text.includes("drone") || text.includes("uav") || text.includes("uas")) {
    return "drone";
  }
  if (text.includes("missile") || text.includes("rocket") || text.includes("ballistic") || text.includes("cruise")) {
    return "missile";
  }
  return "unknown";
}

export function getEventIcon(event: Event) {
  const visualType = getEventVisualType(event);
  if (visualType === "missile") return (Icons as any).Missile;
  if (visualType === "drone") return (Icons as any).Uas;
  if (visualType === "intercept") return (Icons as any).InterceptPoint;
  return (Icons as any).Target;
}

export function getEventColor(event: Event): string {
  const visualType = getEventVisualType(event);
  if (visualType === "missile") return "#ef4444";
  if (visualType === "drone") return "#f59e0b";
  if (visualType === "intercept") return "#e5e5e5";
  return "#9ca3af";
}
