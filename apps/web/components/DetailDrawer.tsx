"use client";

import React, { useEffect, useState } from "react";
import type { Event } from "@conflict-tracker/data-model";
import { getEventColor, getEventIcon } from "@/lib/event-icons";
import { Badge, Button, DrawerPanel, Icon } from "@/lib/ui";

interface DetailDrawerProps {
  event: Event | null;
  isBookmarked: boolean;
  onToggleBookmark: (eventKey: string) => void;
}

function getNoteKey(eventId: string): string {
  // Notes stay in the browser only; key format keeps each note isolated.
  return `ct-note-${eventId}`;
}

function sanitizeExternalUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function DetailDrawer({ event, isBookmarked, onToggleBookmark }: DetailDrawerProps) {
  const [note, setNote] = useState("");

  const parseInlineLinks = (text: string) => {
    const links: Array<{ href: string; label: string; provider?: string }> = [];
    const anchorRegex = /<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>(?:\s|&nbsp;)*(?:<font[^>]*>(.*?)<\/font>)?/gi;
    let match: RegExpExecArray | null = anchorRegex.exec(text);
    while (match) {
      const href = sanitizeExternalUrl(match[1] ?? "");
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
      <DrawerPanel className="c2-detail-panel c2-detail-empty">
        <div className="c2-detail-empty-icon">◎</div>
        <h3>Event Details</h3>
        <p>Select an event on the map or in a cluster list to inspect confidence, sources, and metadata.</p>
      </DrawerPanel>
    );
  }

  const EventIcon = getEventIcon(event);
  const eventColor = getEventColor(event);
  const inlineLinks = parseInlineLinks(event.rawText);
  const safeSources = event.sources
    .map((source) => ({ ...source, safeUrl: sanitizeExternalUrl(source.url) }))
    .filter((source) => source.safeUrl);

  return (
    <aside>
      <DrawerPanel className="c2-detail-panel">
        <header className="c2-detail-header">
          <div className="c2-detail-title-row">
            <span className="c2-detail-event-icon" style={{ color: eventColor }}>
              <Icon>{EventIcon ? <EventIcon width={18} height={18} /> : null}</Icon>
            </span>
            <h3>{event.eventType.toUpperCase()}</h3>
          </div>
          <div className="c2-detail-badges">
            <Badge className="c2-pill">{event.eventType}</Badge>
            <Badge className="c2-pill">confidence {(event.confidence * 100).toFixed(0)}%</Badge>
            <Badge className="c2-pill">sources {event.sources.length}</Badge>
          </div>
        </header>

        <div className="c2-detail-actions">
          <Button
            type="button"
            onClick={() => onToggleBookmark(event.dedupeKey)}
            className={`c2-btn ${isBookmarked ? "is-active" : ""}`}
          >
            {isBookmarked ? "Remove bookmark" : "Bookmark event"}
          </Button>
        </div>

        <section className="c2-detail-section">
          <div className="c2-detail-badges">
            <Badge className="c2-pill actor-pill">
            Actor: {event.actorNationality ?? "unknown"}
            </Badge>
            <Badge className="c2-pill target-pill">
            Target: {event.targetNationality ?? "unknown"}
            </Badge>
          </div>
          <div className="c2-detail-kv">
            <div>
              <span>Time</span>
              <strong>{new Date(event.eventTime).toLocaleString()}</strong>
            </div>
            <div>
              <span>Dedupe Key</span>
              <strong>{event.dedupeKey.slice(0, 16)}...</strong>
            </div>
          </div>
        </section>

        {inlineLinks.length > 0 ? (
          <section className="c2-detail-section">
            <h4>Linked report(s)</h4>
            <ul className="c2-detail-list">
              {inlineLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="c2-detail-link"
                  >
                    {link.label || link.href}
                  </a>
                  {link.provider ? <span className="c2-detail-provider"> ({link.provider})</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="c2-detail-section">
          <h4>Summary</h4>
          <p className="c2-detail-summary">{event.rawText.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()}</p>
        </section>

        <section className="c2-detail-section">
          <h4>Sources</h4>
          <ul className="c2-detail-list">
            {safeSources.map((source) => (
              <li key={`${source.url}-${source.provider}`}>
                <a
                  href={source.safeUrl ?? source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="c2-detail-link"
                >
                  {source.title ?? source.url}
                </a>
                <span className="c2-detail-provider"> ({source.provider})</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="c2-detail-section">
          <h4>Local analyst note</h4>
        <textarea
          id="note"
          rows={5}
          className="c2-note-input"
          value={note}
          onChange={(e) => {
            const next = e.target.value;
            setNote(next);
            // Persist note locally so analysts can refresh without losing context.
            window.localStorage.setItem(getNoteKey(event.dedupeKey), next);
          }}
        />
        </section>
      </DrawerPanel>
    </aside>
  );
}
