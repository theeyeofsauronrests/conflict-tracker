"use client";

import React from "react";
import type { Event } from "@conflict-tracker/data-model";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookmarks } from "@/lib/use-bookmarks";

type SortField = "eventTime" | "eventType" | "confidence" | "actorNationality" | "targetNationality";
type SortDirection = "asc" | "desc";

interface EventsTableViewProps {
  events: Event[];
}

function toMillis(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function EventsTableView({ events }: EventsTableViewProps) {
  const router = useRouter();
  const [eventTypeFilter, setEventTypeFilter] = useState<"all" | "strike" | "intercept">("all");
  const [nationalityFilter, setNationalityFilter] = useState("all");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("eventTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const bookmarks = useBookmarks();

  const nationalityOptions = useMemo(() => {
    const values = new Set<string>();
    for (const event of events) {
      if (event.actorNationality) values.add(event.actorNationality.toLowerCase());
      if (event.targetNationality) values.add(event.targetNationality.toLowerCase());
    }
    return Array.from(values).sort();
  }, [events]);

  const filteredAndSorted = useMemo(() => {
    const fromMillis = fromFilter ? toMillis(fromFilter) : Number.NEGATIVE_INFINITY;
    const toMillisValue = toFilter ? toMillis(toFilter) : Number.POSITIVE_INFINITY;

    const filtered = events.filter((event) => {
      if (eventTypeFilter !== "all" && event.eventType !== eventTypeFilter) {
        return false;
      }

      if (nationalityFilter !== "all") {
        const actor = event.actorNationality?.toLowerCase() ?? "";
        const target = event.targetNationality?.toLowerCase() ?? "";
        if (actor !== nationalityFilter && target !== nationalityFilter) {
          return false;
        }
      }

      if (bookmarkedOnly && !bookmarks.bookmarkIds.has(event.dedupeKey)) {
        return false;
      }

      const eventMillis = toMillis(event.eventTime);
      if (eventMillis < fromMillis || eventMillis > toMillisValue) {
        return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortField === "eventTime") return (toMillis(a.eventTime) - toMillis(b.eventTime)) * direction;
      if (sortField === "confidence") return (a.confidence - b.confidence) * direction;
      if (sortField === "eventType") return a.eventType.localeCompare(b.eventType) * direction;
      if (sortField === "actorNationality") return (a.actorNationality ?? "").localeCompare(b.actorNationality ?? "") * direction;
      return (a.targetNationality ?? "").localeCompare(b.targetNationality ?? "") * direction;
    });

    return sorted;
  }, [events, eventTypeFilter, nationalityFilter, fromFilter, toFilter, bookmarkedOnly, sortField, sortDirection, bookmarks.bookmarkIds]);

  function onSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("desc");
  }

  const controlStyle = {
    background: "#050505",
    color: "var(--c2-text)",
    border: "1px solid var(--c2-border)",
    borderRadius: 4,
    padding: "6px 8px"
  } as const;

  const buttonStyle = {
    background: "#101010",
    color: "var(--c2-text)",
    border: "1px solid var(--c2-border)",
    borderRadius: 4,
    padding: "4px 8px",
    cursor: "pointer"
  } as const;

  return (
    <main style={{ padding: 16 }}>
      <section
        style={{
          border: "1px solid var(--c2-border)",
          borderRadius: 8,
          background: "var(--c2-panel)",
          padding: 12,
          marginBottom: 12,
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))"
        }}
      >
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "var(--c2-muted)", fontSize: 12 }}>Event Type</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value as "all" | "strike" | "intercept")}
            style={controlStyle}
          >
            <option value="all">All</option>
            <option value="strike">Strike</option>
            <option value="intercept">Intercept</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "var(--c2-muted)", fontSize: 12 }}>Nationality</span>
          <select value={nationalityFilter} onChange={(e) => setNationalityFilter(e.target.value)} style={controlStyle}>
            <option value="all">All</option>
            {nationalityOptions.map((nation) => (
              <option key={nation} value={nation}>
                {nation.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "var(--c2-muted)", fontSize: 12 }}>From (Date/Time)</span>
          <input type="datetime-local" value={fromFilter} onChange={(e) => setFromFilter(e.target.value)} style={controlStyle} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "var(--c2-muted)", fontSize: 12 }}>To (Date/Time)</span>
          <input type="datetime-local" value={toFilter} onChange={(e) => setToFilter(e.target.value)} style={controlStyle} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
          <input type="checkbox" checked={bookmarkedOnly} onChange={(e) => setBookmarkedOnly(e.target.checked)} />
          <span style={{ color: "var(--c2-text)", fontSize: 13 }}>Bookmarked only</span>
        </label>
      </section>

      <section style={{ marginBottom: 8, color: "var(--c2-muted)" }}>
        Showing {filteredAndSorted.length} of {events.length} events ({bookmarks.ready ? bookmarks.bookmarkCount : 0} bookmarked locally)
      </section>

      <div style={{ overflowX: "auto", border: "1px solid var(--c2-border)", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr style={{ background: "#101010" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--c2-border)" }}>Bookmark</th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--c2-border)" }}>Open</th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--c2-border)" }}>
                <button type="button" onClick={() => onSort("eventTime")} style={buttonStyle}>
                  Time
                </button>
              </th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--c2-border)" }}>
                <button type="button" onClick={() => onSort("eventType")} style={buttonStyle}>
                  Type
                </button>
              </th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--c2-border)" }}>
                <button type="button" onClick={() => onSort("actorNationality")} style={buttonStyle}>
                  Actor
                </button>
              </th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--c2-border)" }}>
                <button type="button" onClick={() => onSort("targetNationality")} style={buttonStyle}>
                  Target
                </button>
              </th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--c2-border)" }}>
                <button type="button" onClick={() => onSort("confidence")} style={buttonStyle}>
                  Confidence
                </button>
              </th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--c2-border)" }}>Summary</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((event) => (
              <tr key={event.dedupeKey} style={{ borderBottom: "1px solid #161616" }}>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    type="button"
                    onClick={() => bookmarks.toggleBookmark(event.dedupeKey)}
                    style={{ ...buttonStyle, minWidth: 40 }}
                    aria-label={`Toggle bookmark for ${event.dedupeKey}`}
                  >
                    {bookmarks.isBookmarked(event.dedupeKey) ? "★" : "☆"}
                  </button>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/?event=${encodeURIComponent(event.dedupeKey)}`)}
                    style={buttonStyle}
                  >
                    View on map
                  </button>
                </td>
                <td style={{ padding: "10px 12px" }}>{new Date(event.eventTime).toLocaleString()}</td>
                <td style={{ padding: "10px 12px", textTransform: "uppercase" }}>{event.eventType}</td>
                <td style={{ padding: "10px 12px", textTransform: "uppercase" }}>{event.actorNationality ?? "unknown"}</td>
                <td style={{ padding: "10px 12px", textTransform: "uppercase" }}>{event.targetNationality ?? "unknown"}</td>
                <td style={{ padding: "10px 12px" }}>{(event.confidence * 100).toFixed(0)}%</td>
                <td style={{ padding: "10px 12px" }}>{event.rawText.replace(/<[^>]+>/g, "").slice(0, 180)}</td>
              </tr>
            ))}
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "14px 12px", color: "var(--c2-muted)" }}>
                  No events match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
