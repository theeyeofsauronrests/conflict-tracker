"use client";

import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as DT from "@accelint/design-toolkit";
import * as Icons from "@accelint/icons";
import type { Event } from "@conflict-tracker/data-model";

const Drawer = (DT as any).Drawer ?? (({ children }: { children: ReactNode }) => <aside>{children}</aside>);
const Icon = (DT as any).Icon ?? (({ children }: { children: ReactNode }) => <span>{children}</span>);
const TargetIcon = (Icons as any).Target;

interface DetailDrawerProps {
  event: Event | null;
}

function getNoteKey(eventId: string): string {
  // Notes stay in the browser only; key format keeps each note isolated.
  return `ct-note-${eventId}`;
}

export function DetailDrawer({ event }: DetailDrawerProps) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!event) return;
    // Load the saved local note whenever the user switches to another event.
    const cached = window.localStorage.getItem(getNoteKey(event.dedupeKey));
    setNote(cached ?? "");
  }, [event]);

  if (!event) {
    return (
      <div style={{ padding: 12, border: "1px solid #2a3a52", borderRadius: 8, background: "#182332" }}>
        Select an event for details.
      </div>
    );
  }

  return (
    <Drawer>
      <div style={{ padding: 12, border: "1px solid #2a3a52", borderRadius: 8, background: "#182332" }}>
        <h3 style={{ marginTop: 0 }}>
          <Icon>{TargetIcon ? <TargetIcon /> : null}</Icon> {event.eventType.toUpperCase()}
        </h3>
        <p style={{ color: "#8ba0c0" }}>Confidence: {(event.confidence * 100).toFixed(0)}%</p>
        <p style={{ color: "#8ba0c0" }}>Time: {new Date(event.eventTime).toLocaleString()}</p>
        <p>{event.rawText}</p>
        <label htmlFor="note">Local analyst note (browser-only)</label>
        <textarea
          id="note"
          rows={5}
          style={{ width: "100%", marginTop: 8, background: "#0d131b", color: "#dfe8f7", borderColor: "#2a3a52" }}
          value={note}
          onChange={(e) => {
            const next = e.target.value;
            setNote(next);
            // Persist note locally so analysts can refresh without losing context.
            window.localStorage.setItem(getNoteKey(event.dedupeKey), next);
          }}
        />
      </div>
    </Drawer>
  );
}
