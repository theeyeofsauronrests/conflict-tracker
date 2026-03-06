"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import BaseMap from "react-map-gl/maplibre";
import { useSearchParams } from "next/navigation";
import { getDefaultViewport } from "@conflict-tracker/map-layers";
import type { Event as ConflictEvent, ForcePosition, AssetPosition } from "@conflict-tracker/data-model";
import * as DT from "@accelint/design-toolkit";
import { nationalityColorMap } from "@/lib/colors";
import { getEventColor, getEventIcon } from "@/lib/event-icons";
import { DetailDrawer } from "./DetailDrawer";
import { TimelineSlider } from "./TimelineSlider";

interface ConflictMapProps {
  events: ConflictEvent[];
  forces: ForcePosition[];
  assets: AssetPosition[];
}

interface ClusterBucket {
  id: string;
  lon: number;
  lat: number;
  events: ConflictEvent[];
}

interface ViewportSize {
  width: number;
  height: number;
}

function projectToScreen(
  lon: number,
  lat: number,
  viewState: { longitude: number; latitude: number; zoom: number },
  size: ViewportSize
): { x: number; y: number } {
  const scale = 512 * 2 ** viewState.zoom;
  const projectPoint = (lng: number, latitude: number) => {
    const x = ((lng + 180) / 360) * scale;
    const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, latitude));
    const sin = Math.sin((clampedLat * Math.PI) / 180);
    const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
    return { x, y };
  };

  const center = projectPoint(viewState.longitude, viewState.latitude);
  const point = projectPoint(lon, lat);
  return {
    x: point.x - center.x + size.width / 2,
    y: point.y - center.y + size.height / 2
  };
}

function normalizeNation(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "unknown") return null;
  return normalized;
}

function buildHighlightState(event: ConflictEvent, selectedEvent: ConflictEvent | null): {
  highlightActor: boolean;
  highlightTarget: boolean;
} {
  if (!selectedEvent) return { highlightActor: false, highlightTarget: false };

  const selectedActor = normalizeNation(selectedEvent.actorNationality);
  const selectedTarget = normalizeNation(selectedEvent.targetNationality);
  const eventActor = normalizeNation(event.actorNationality);
  const eventTarget = normalizeNation(event.targetNationality);

  return {
    highlightActor: Boolean(selectedActor && (eventActor === selectedActor || eventTarget === selectedActor)),
    highlightTarget: Boolean(selectedTarget && (eventActor === selectedTarget || eventTarget === selectedTarget))
  };
}

function buildClusters(events: ConflictEvent[], zoom: number): ClusterBucket[] {
  const cellSizeDeg = Math.max(0.02, 8 / 2 ** zoom);
  const buckets = new Map<string, ConflictEvent[]>();

  for (const event of events) {
    const x = Math.round(event.lon / cellSizeDeg);
    const y = Math.round(event.lat / cellSizeDeg);
    const key = `${x}:${y}`;
    const list = buckets.get(key);
    if (list) list.push(event);
    else buckets.set(key, [event]);
  }

  return Array.from(buckets.entries()).map(([key, grouped]) => {
    const lon = grouped.reduce((sum, event) => sum + event.lon, 0) / grouped.length;
    const lat = grouped.reduce((sum, event) => sum + event.lat, 0) / grouped.length;
    return {
      id: key,
      lon,
      lat,
      events: grouped
    };
  });
}

export function ConflictMap({ events, forces, assets }: ConflictMapProps) {
  const searchParams = useSearchParams();
  const selectedEventFromQuery = searchParams?.get("event") ?? null;

  // Keep the clicked event in local UI state so the drawer can show details.
  const [selectedEvent, setSelectedEvent] = useState<ConflictEvent | null>(null);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  // Timeline range is tracked as indices into available event timestamps.
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  // Current time in the header helps analysts compare feed recency against "now".
  const [now, setNow] = useState<Date | null>(null);
  // We only format locale-dependent timestamps after mount to avoid hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [viewState, setViewState] = useState(() => getDefaultViewport());
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const Icon = (DT as any).Icon ?? (({ children }: { children: React.ReactNode }) => <span>{children}</span>);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const element = mapContainerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = mapContainerRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      // Prevent browser page zoom while interacting with the map area.
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    // Safari pinch events can leak to page zoom without this guard.
    const onGesture = (event: globalThis.Event) => {
      event.preventDefault();
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("gesturestart", onGesture as EventListener, { passive: false } as AddEventListenerOptions);
    element.addEventListener("gesturechange", onGesture as EventListener, { passive: false } as AddEventListenerOptions);
    return () => {
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("gesturestart", onGesture as EventListener);
      element.removeEventListener("gesturechange", onGesture as EventListener);
    };
  }, []);

  const availableTimestamps = useMemo(() => {
    const unique = new Set<number>();
    for (const event of events) {
      const millis = new Date(event.eventTime).getTime();
      if (Number.isFinite(millis)) {
        unique.add(millis);
      }
    }
    return Array.from(unique).sort((a, b) => a - b);
  }, [events]);

  useEffect(() => {
    if (availableTimestamps.length === 0) {
      setStartIndex(0);
      setEndIndex(0);
      return;
    }

    const lastIndex = availableTimestamps.length - 1;
    const latestTs = availableTimestamps[lastIndex] ?? Date.now();
    const defaultCutoff = latestTs - 72 * 60 * 60 * 1000;
    const defaultStart = Math.max(0, availableTimestamps.findIndex((ts) => ts >= defaultCutoff));

    setStartIndex((current) => Math.min(current, lastIndex));
    setEndIndex((current) => (current > 0 ? Math.min(current, lastIndex) : lastIndex));

    // First meaningful load: initialize to approximately the last 72h, snapped to available records.
    if (startIndex === 0 && endIndex === 0) {
      setStartIndex(defaultStart);
      setEndIndex(lastIndex);
    }
  }, [availableTimestamps, startIndex, endIndex]);

  useEffect(() => {
    if (!selectedEventFromQuery) return;
    const match = events.find((event) => event.dedupeKey === selectedEventFromQuery);
    if (!match) return;

    setSelectedEvent(match);

    const matchMillis = new Date(match.eventTime).getTime();
    if (!Number.isFinite(matchMillis) || availableTimestamps.length === 0) return;
    const index = availableTimestamps.findIndex((ts) => ts === matchMillis);
    if (index < 0) return;

    if (index < startIndex) {
      setStartIndex(index);
    }
    if (index > endIndex) {
      setEndIndex(index);
    }
  }, [selectedEventFromQuery, events, availableTimestamps, startIndex, endIndex]);

  const startTs = availableTimestamps[startIndex] ?? Number.NEGATIVE_INFINITY;
  const endTs = availableTimestamps[endIndex] ?? Number.POSITIVE_INFINITY;
  // Show only events inside the selected record-bounded timeline range.
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventTs = new Date(event.eventTime).getTime();
      if (!Number.isFinite(eventTs)) return false;
      return eventTs >= startTs && eventTs <= endTs;
    });
  }, [events, startTs, endTs]);
  const clusters = useMemo(() => buildClusters(filteredEvents, viewState.zoom ?? 4), [filteredEvents, viewState.zoom]);
  const expandedCluster = useMemo(
    () => clusters.find((cluster) => cluster.id === expandedClusterId) ?? null,
    [clusters, expandedClusterId]
  );
  const effectiveViewportSize = useMemo<ViewportSize>(() => {
    if (viewportSize.width > 0 && viewportSize.height > 0) return viewportSize;
    return { width: 1200, height: 800 };
  }, [viewportSize]);

  const darkMapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";
  // "Data as of" is the freshest timestamp we have across events and positions.
  const dataAsOf = useMemo(() => {
    const millis = [
      ...events.map((event) => new Date(event.ingestedAt ?? event.eventTime).getTime()),
      ...forces.map((force) => new Date(force.observedTime).getTime()),
      ...assets.map((asset) => new Date(asset.observedTime).getTime())
    ].filter((value) => Number.isFinite(value));
    if (millis.length === 0) return null;
    return new Date(Math.max(...millis));
  }, [events, forces, assets]);

  return (
    <main style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, padding: 16, alignItems: "start" }}>
      <header
        style={{
          gridColumn: "1 / -1",
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          border: "1px solid var(--c2-border)",
          borderRadius: 8,
          background: "var(--c2-panel)",
          padding: "10px 12px"
        }}
      >
        <div>
          <div style={{ color: "var(--c2-muted)", fontSize: 12, textTransform: "uppercase" }}>Current time</div>
          <strong suppressHydrationWarning>{mounted && now ? now.toLocaleString() : "Loading..."}</strong>
        </div>
        <div>
          <div style={{ color: "var(--c2-muted)", fontSize: 12, textTransform: "uppercase" }}>Data as of</div>
          <strong suppressHydrationWarning>{mounted && dataAsOf ? dataAsOf.toLocaleString() : "No data loaded"}</strong>
        </div>
        <div>
          <div style={{ color: "var(--c2-muted)", fontSize: 12, textTransform: "uppercase" }}>Event tally</div>
          <strong>
            {filteredEvents.length} visible / {events.length} total
          </strong>
        </div>
      </header>
      <section style={{ minWidth: 0 }}>
        <TimelineSlider
          timestamps={availableTimestamps}
          startIndex={startIndex}
          endIndex={endIndex}
          onChange={(nextStartIndex, nextEndIndex) => {
            setStartIndex(nextStartIndex);
            setEndIndex(nextEndIndex);
          }}
        />
        <div
          ref={mapContainerRef}
          style={{
            marginTop: 12,
            height: "75vh",
            border: "1px solid var(--c2-border)",
            borderRadius: 8,
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
            touchAction: "none"
          }}
        >
          <BaseMap
            longitude={viewState.longitude}
            latitude={viewState.latitude}
            zoom={viewState.zoom}
            pitch={viewState.pitch}
            bearing={viewState.bearing}
            onMove={(event) => {
              setViewState((prev) => ({
                ...prev,
                longitude: event.viewState.longitude,
                latitude: event.viewState.latitude,
                zoom: event.viewState.zoom,
                pitch: event.viewState.pitch,
                bearing: event.viewState.bearing
              }));
            }}
            style={{ position: "absolute", inset: "0" }}
            reuseMaps
            attributionControl={false}
            mapStyle={darkMapStyle}
            dragRotate={false}
            doubleClickZoom
            cursor="grab"
          />
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
            {/* Event markers are projected manually to screen space so they stay interactive and visible across maplibre quirks. */}
            {clusters
              .filter((cluster) => cluster.events.length === 1 && cluster.id !== expandedClusterId)
              .map((cluster) => {
                const event = cluster.events[0]!;
                const EventIcon = getEventIcon(event);
                const color = getEventColor(event);
                const highlight = buildHighlightState(event, selectedEvent);
                const screen = projectToScreen(cluster.lon, cluster.lat, viewState, effectiveViewportSize);
                return (
                  <button
                    key={event.dedupeKey}
                    type="button"
                    aria-label={`Select ${event.eventType} event`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                    style={{
                      position: "absolute",
                      left: screen.x,
                      top: screen.y,
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "auto",
                      display: "inline-grid",
                      placeItems: "center",
                      width: 24,
                      height: 24,
                      border: highlight.highlightActor ? "1px solid #7ee7ff" : highlight.highlightTarget ? "1px solid #ffd27c" : "none",
                      borderRadius: 999,
                      background: highlight.highlightActor
                        ? "rgba(126, 231, 255, 0.12)"
                        : highlight.highlightTarget
                          ? "rgba(255, 210, 124, 0.12)"
                          : "rgba(0, 0, 0, 0.35)",
                      padding: 0,
                      color,
                      textShadow: "0 0 8px rgba(0,0,0,0.95)",
                      boxShadow: highlight.highlightActor || highlight.highlightTarget ? "0 0 10px rgba(255,255,255,0.22)" : "none",
                      cursor: "pointer"
                    }}
                  >
                    <span style={{ display: "inline-grid", placeItems: "center", width: 18, height: 18, lineHeight: 1 }}>
                      <Icon>{EventIcon ? <EventIcon width={18} height={18} /> : <span style={{ fontSize: 10 }}>•</span>}</Icon>
                    </span>
                  </button>
                );
              })}
            {clusters
              .filter((cluster) => cluster.events.length > 1 && cluster.id !== expandedClusterId)
              .map((cluster) => {
                const screen = projectToScreen(cluster.lon, cluster.lat, viewState, effectiveViewportSize);
                return (
                  <button
                    key={`cluster-${cluster.id}`}
                    type="button"
                    aria-label={`Expand cluster with ${cluster.events.length} events`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpandedClusterId(cluster.id);
                    }}
                    style={{
                      position: "absolute",
                      left: screen.x,
                      top: screen.y,
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "auto",
                      minWidth: 30,
                      height: 30,
                      borderRadius: 999,
                      border: "1px solid #6b7280",
                      background: "#1f2937",
                      color: "#f8fafc",
                      fontWeight: 700,
                      fontSize: 12,
                      padding: "0 9px",
                      cursor: "pointer"
                    }}
                  >
                    {cluster.events.length}
                  </button>
                );
              })}
          </div>
          {expandedCluster ? (
            <div
              onClick={() => setExpandedClusterId(null)}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,
                background: "rgba(0, 0, 0, 0.55)",
                display: "grid",
                placeItems: "center",
                padding: 16
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(520px, 100%)",
                  maxHeight: "80%",
                  overflow: "auto",
                  background: "var(--c2-panel)",
                  border: "1px solid var(--c2-border)",
                  borderRadius: 10,
                  padding: 12
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <strong>{expandedCluster.events.length} events in this cluster</strong>
                  <button
                    type="button"
                    onClick={() => setExpandedClusterId(null)}
                    style={{
                      border: "1px solid var(--c2-border)",
                      background: "#111827",
                      color: "var(--c2-text)",
                      borderRadius: 6,
                      padding: "4px 8px",
                      cursor: "pointer"
                    }}
                  >
                    Close
                  </button>
                </div>
                {expandedCluster.events
                  .slice()
                  .sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime())
                  .map((event) => {
                    const EventIcon = getEventIcon(event);
                    const color = getEventColor(event);
                    return (
                      <button
                        key={`cluster-row-${event.dedupeKey}`}
                        type="button"
                        onClick={() => {
                          setSelectedEvent(event);
                          setExpandedClusterId(null);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          marginBottom: 8,
                          border: "1px solid var(--c2-border)",
                          background: "#0a0f16",
                          color: "var(--c2-text)",
                          borderRadius: 8,
                          padding: "8px 10px",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color, display: "inline-grid", placeItems: "center", width: 18, height: 18 }}>
                            <Icon>{EventIcon ? <EventIcon width={16} height={16} /> : null}</Icon>
                          </span>
                          <strong style={{ textTransform: "uppercase", fontSize: 12 }}>{event.eventType}</strong>
                          <span style={{ color: "var(--c2-muted)", fontSize: 12 }}>{new Date(event.eventTime).toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: 4, color: "var(--c2-muted)", fontSize: 12 }}>
                          {event.actorNationality ?? "unknown"} {" -> "} {event.targetNationality ?? "unknown"}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : null}
        </div>
        {/* Legend explains nationality color coding for quick scanning. */}
        <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 999, border: "1px solid #7ee7ff" }} />
            <span style={{ color: "var(--c2-muted)", textTransform: "uppercase", fontSize: 12 }}>Actor match</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 999, border: "1px solid #ffd27c" }} />
            <span style={{ color: "var(--c2-muted)", textTransform: "uppercase", fontSize: 12 }}>Target match</span>
          </div>
          {Object.entries(nationalityColorMap).map(([nation, color]) => (
            <div key={nation} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 999, background: color }} />
              <span style={{ color: "var(--c2-muted)", textTransform: "uppercase", fontSize: 12 }}>{nation}</span>
            </div>
          ))}
        </div>
      </section>
      <aside style={{ position: "relative", zIndex: 3 }}>
        <DetailDrawer event={selectedEvent} />
      </aside>
    </main>
  );
}
