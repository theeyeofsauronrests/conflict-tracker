"use client";

import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as DT from "@accelint/design-toolkit";
import type { Event } from "@conflict-tracker/data-model";
import { getEventColor, getEventIcon } from "@/lib/event-icons";

const Icon = (DT as any).Icon ?? (({ children }: { children: ReactNode }) => <span>{children}</span>);

interface DetailDrawerProps {
  event: Event | null;
}

function getNoteKey(eventId: string): string {
  // Notes stay in the browser only; key format keeps each note isolated.
  return `ct-note-${eventId}`;
}

export function DetailDrawer({ event }: DetailDrawerProps) {
  const [note, setNote] = useState("");

  const parseInlineLinks = (text: string) => {
    const links: Array<{ href: string; label: string; provider?: string }> = [];
    const anchorRegex = /<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>(?:\s|&nbsp;)*(?:<font[^>]*>(.*?)<\/font>)?/gi;
    let match: RegExpExecArray | null = anchorRegex.exec(text);
    while (match) {
      const href = match[1] ?? "";
      const label = (match[2] ?? "").replace(/<[^>]+>/g, "").trim();
      if (!href) {
        match = anchorRegex.exec(text);
        continue;
      }
      links.push({
        href,
        label,
        provider: match[3]?.replace(/<[^>]+>/g, "").trim()
      });
      match = anchorRegex.exec(text);
    }
    return links;
  };

  useEffect(() => {
    if (!event) return;
    // Load the saved local note whenever the user switches to another event.
    const cached = window.localStorage.getItem(getNoteKey(event.dedupeKey));
    setNote(cached ?? "");
  }, [event]);

  if (!event) {
    return (
      <div style={{ padding: 12, border: "1px solid var(--c2-border)", borderRadius: 8, background: "var(--c2-panel)" }}>
        Select an event for details.
      </div>
    );
  }

  const EventIcon = getEventIcon(event);
  const eventColor = getEventColor(event);
  const inlineLinks = parseInlineLinks(event.rawText);

  return (
    <aside>
      <div style={{ padding: 12, border: "1px solid var(--c2-border)", borderRadius: 8, background: "var(--c2-panel)" }}>
        <h3 style={{ marginTop: 0 }}>
          <Icon>{EventIcon ? <EventIcon /> : null}</Icon> {event.eventType.toUpperCase()}
        </h3>
        <p style={{ color: eventColor, marginTop: -6, marginBottom: 10 }}>Type: {event.eventType}</p>
        <p style={{ color: "var(--c2-muted)" }}>Confidence: {(event.confidence * 100).toFixed(0)}%</p>
        <p style={{ color: "var(--c2-muted)" }}>Time: {new Date(event.eventTime).toLocaleString()}</p>
        {inlineLinks.length > 0 ? (
          <div style={{ marginBottom: 10 }}>
            <strong>Linked report(s):</strong>
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              {inlineLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#e5e5e5", textDecoration: "underline", textUnderlineOffset: 2 }}
                  >
                    {link.label || link.href}
                  </a>
                  {link.provider ? <span style={{ color: "var(--c2-muted)" }}> ({link.provider})</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p>{event.rawText.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()}</p>
        <div style={{ marginTop: 10 }}>
          <strong>Sources:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 18 }}>
            {event.sources.map((source) => (
              <li key={`${source.url}-${source.provider}`}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#e5e5e5", textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  {source.title ?? source.url}
                </a>
                <span style={{ color: "var(--c2-muted)" }}> ({source.provider})</span>
              </li>
            ))}
          </ul>
        </div>
        <label htmlFor="note">Local analyst note (browser-only)</label>
        <textarea
          id="note"
          rows={5}
          style={{
            width: "100%",
            marginTop: 8,
            background: "#050505",
            color: "var(--c2-text)",
            borderColor: "var(--c2-border)"
          }}
          value={note}
          onChange={(e) => {
            const next = e.target.value;
            setNote(next);
            // Persist note locally so analysts can refresh without losing context.
            window.localStorage.setItem(getNoteKey(event.dedupeKey), next);
          }}
        />
      </div>
    </aside>
  );
}
