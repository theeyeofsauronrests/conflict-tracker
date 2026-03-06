"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import BaseMap from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { useRouter, useSearchParams } from "next/navigation";
import { createOptionalLayers, createPrimaryLayers, createSavedViewport, getDefaultViewport } from "@conflict-tracker/map-layers";
import type { Event as ConflictEvent, ForcePosition, AssetPosition } from "@conflict-tracker/data-model";
import { nationalityColorMap } from "@/lib/colors";
import { getEventColor, getEventIcon } from "@/lib/event-icons";
import { useBookmarks } from "@/lib/use-bookmarks";
import { DetailDrawer } from "./DetailDrawer";
import { TimelineSlider } from "./TimelineSlider";
import { Button, Icon } from "@/lib/ui";

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

interface EventArc {
  id: string;
  actorNation: string;
  from: { lon: number; lat: number };
  to: { lon: number; lat: number };
  confidence: number;
}

function CurrentTimeStatusChip() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="c2-status-chip">
      <span>Current Time</span>
      <strong suppressHydrationWarning>{now.toLocaleString()}</strong>
    </div>
  );
}

function LocalizedDateTime({ value, fallback }: { value: Date | null; fallback: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!value) return <strong>{fallback}</strong>;

  return <strong suppressHydrationWarning>{mounted ? value.toLocaleString() : fallback}</strong>;
}

function toMillis(value: string): number {
  const millis = new Date(value).getTime();
  return Number.isFinite(millis) ? millis : Number.NaN;
}

const NATIONALITY_ANCHORS: Record<string, { lon: number; lat: number }> = {
  iran: { lon: 51.389, lat: 35.689 },
  israel: { lon: 35.2137, lat: 31.7683 },
  iraq: { lon: 44.3661, lat: 33.3152 },
  usa: { lon: -77.0369, lat: 38.9072 },
  lebanon: { lon: 35.5018, lat: 33.8938 },
  cyprus: { lon: 33.3823, lat: 35.1856 },
  jordan: { lon: 35.9106, lat: 31.9539 },
  syria: { lon: 36.2765, lat: 33.5138 },
  saudi: { lon: 46.6753, lat: 24.7136 },
  uae: { lon: 54.3773, lat: 24.4539 },
  qatar: { lon: 51.531, lat: 25.2854 },
  yemen: { lon: 44.2075, lat: 15.3694 },
  turkey: { lon: 32.8597, lat: 39.9334 },
  russia: { lon: 37.6173, lat: 55.7558 }
};

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

function resolveNationAnchor(nation: string, centroid: { lon: number; lat: number } | null): { lon: number; lat: number } | null {
  if (centroid) return centroid;
  return NATIONALITY_ANCHORS[nation] ?? null;
}

function buildEventArcs(events: ConflictEvent[]): EventArc[] {
  const actorBuckets = new Map<string, { lonSum: number; latSum: number; count: number }>();

  for (const event of events) {
    const actor = normalizeNation(event.actorNationality);
    if (!actor) continue;

    const actorBucket = actorBuckets.get(actor) ?? { lonSum: 0, latSum: 0, count: 0 };
    actorBucket.lonSum += event.lon;
    actorBucket.latSum += event.lat;
    actorBucket.count += 1;
    actorBuckets.set(actor, actorBucket);
  }

  const actorCentroids = new Map<string, { lon: number; lat: number }>();

  for (const [nation, bucket] of actorBuckets.entries()) {
    actorCentroids.set(nation, { lon: bucket.lonSum / bucket.count, lat: bucket.latSum / bucket.count });
  }

  const arcs: EventArc[] = [];
  for (const event of events) {
    const actor = normalizeNation(event.actorNationality);
    if (!actor) continue;

    // Event coordinates represent the impacted location (target point on map).
    const to = { lon: event.lon, lat: event.lat };
    const from = resolveNationAnchor(actor, actorCentroids.get(actor) ?? null);
    if (!from) continue;
    const distance = Math.hypot(to.lon - from.lon, to.lat - from.lat);
    if (!Number.isFinite(distance) || distance < 0.25) continue;

    arcs.push({
      id: `arc-${event.dedupeKey}`,
      actorNation: actor,
      from,
      to,
      confidence: event.confidence
    });
  }

  return arcs;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedEventFromQuery = searchParams?.get("event") ?? null;

  // Keep the clicked event in local UI state so the drawer can show details.
  const [selectedEvent, setSelectedEvent] = useState<ConflictEvent | null>(null);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  // Timeline range is tracked as indices into available event timestamps.
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  const [showArcs, setShowArcs] = useState(true);
  const [showPluginOverlays, setShowPluginOverlays] = useState(true);
  const [showAnalysisOverlays, setShowAnalysisOverlays] = useState(false);
  const [viewState, setViewState] = useState(() => getDefaultViewport());
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const bookmarks = useBookmarks();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("conflict-tracker-show-arcs");
      if (saved === "0") setShowArcs(false);
      if (saved === "1") setShowArcs(true);
    } catch {
      // Ignore storage access failures and keep default.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("conflict-tracker-show-arcs", showArcs ? "1" : "0");
    } catch {
      // Ignore storage access failures.
    }
  }, [showArcs]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("conflict-tracker-viewport");
      if (!saved) return;
      const parsed = JSON.parse(saved) as { longitude: number; latitude: number; zoom: number; pitch: number; bearing: number };
      if (
        Number.isFinite(parsed.longitude) &&
        Number.isFinite(parsed.latitude) &&
        Number.isFinite(parsed.zoom) &&
        Number.isFinite(parsed.pitch) &&
        Number.isFinite(parsed.bearing)
      ) {
        setViewState(parsed);
      }
    } catch {
      // Ignore malformed saved viewport payloads.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("conflict-tracker-viewport", JSON.stringify(createSavedViewport(viewState)));
    } catch {
      // Ignore storage access failures.
    }
  }, [viewState]);

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

  // Parse event timestamps once per feed update and reuse in timeline filtering.
  const parsedEventTimeline = useMemo(() => {
    return events
      .map((event) => ({ event, eventTimeMillis: toMillis(event.eventTime) }))
      .filter((entry) => Number.isFinite(entry.eventTimeMillis));
  }, [events]);

  const availableTimestamps = useMemo(() => {
    const unique = new Set<number>();
    for (const entry of parsedEventTimeline) {
      unique.add(entry.eventTimeMillis);
    }
    return Array.from(unique).sort((a, b) => a - b);
  }, [parsedEventTimeline]);

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
    return parsedEventTimeline
      .filter((entry) => entry.eventTimeMillis >= startTs && entry.eventTimeMillis <= endTs)
      .map((entry) => entry.event);
  }, [parsedEventTimeline, startTs, endTs]);
  const clusters = useMemo(() => buildClusters(filteredEvents, viewState.zoom ?? 4), [filteredEvents, viewState.zoom]);
  const eventArcs = useMemo(() => buildEventArcs(filteredEvents), [filteredEvents]);
  // Keep layer plugin outputs in sync with the visible timeline data, even while using a maplibre-first renderer.
  const primaryLayers = useMemo(() => createPrimaryLayers(filteredEvents, forces, assets), [filteredEvents, forces, assets]);
  const optionalLayers = useMemo(() => createOptionalLayers(filteredEvents), [filteredEvents]);
  const mapOverlayLayers = useMemo(() => {
    // Keep event icons/clusters as the primary visual language, while still integrating plugin layer output.
    const alwaysOn = primaryLayers.filter((layer) => {
      const id = String((layer as { id?: string }).id ?? "");
      return id !== "strikes-layer" && id !== "intercepts-layer";
    });
    if (!showPluginOverlays) return [];
    return showAnalysisOverlays ? [...alwaysOn, ...optionalLayers] : alwaysOn;
  }, [optionalLayers, primaryLayers, showAnalysisOverlays, showPluginOverlays]);
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
      ...events.map((event) => toMillis(event.ingestedAt ?? event.eventTime)),
      ...forces.map((force) => new Date(force.observedTime).getTime()),
      ...assets.map((asset) => new Date(asset.observedTime).getTime())
    ].filter((value) => Number.isFinite(value));
    if (millis.length === 0) return null;
    return new Date(Math.max(...millis));
  }, [events, forces, assets]);

  return (
    <main className="c2-workspace">
      <section className="c2-status-strip">
        <CurrentTimeStatusChip />
        <div className="c2-status-chip">
          <span>Data As Of</span>
          <LocalizedDateTime value={dataAsOf} fallback="No data loaded" />
        </div>
        <div className="c2-status-chip">
          <span>Event Tally</span>
          <strong>
            {filteredEvents.length} visible / {events.length} total
          </strong>
        </div>
        <div className="c2-status-chip">
          <span>Bookmarks</span>
          <Button
            type="button"
            className="c2-status-link"
            onClick={() => router.push("/table?bookmarked=1")}
            aria-label="Open table view filtered to bookmarked events"
          >
            {bookmarks.ready ? bookmarks.bookmarkCount : 0} local
          </Button>
        </div>
      </section>

      <section className="c2-main-grid">
        <div className="c2-map-column">
          <div className="c2-control-bar">
            <TimelineSlider
              timestamps={availableTimestamps}
              startIndex={startIndex}
              endIndex={endIndex}
              onChange={(nextStartIndex, nextEndIndex) => {
                setStartIndex(nextStartIndex);
                setEndIndex(nextEndIndex);
              }}
            />
            <div className="c2-layer-controls">
              <span className="c2-layer-label">Layers</span>
              <Button
                type="button"
                aria-pressed={showArcs}
                onClick={() => setShowArcs((value) => !value)}
                className={`c2-toggle-btn ${showArcs ? "is-active" : ""}`}
              >
                Actor arcs
              </Button>
              <Button
                type="button"
                aria-pressed={showPluginOverlays}
                onClick={() => setShowPluginOverlays((value) => !value)}
                className={`c2-toggle-btn ${showPluginOverlays ? "is-active" : ""}`}
              >
                Operational overlays
              </Button>
              <Button
                type="button"
                aria-pressed={showAnalysisOverlays}
                disabled={!showPluginOverlays}
                onClick={() => setShowAnalysisOverlays((value) => !value)}
                className={`c2-toggle-btn ${showAnalysisOverlays ? "is-active" : ""}`}
              >
                Analytic density
              </Button>
            </div>
          </div>

          <div ref={mapContainerRef} className="c2-map-shell">
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
          <DeckGL
            viewState={viewState}
            controller={false}
            layers={mapOverlayLayers}
            style={{ position: "absolute", inset: "0", zIndex: "1", pointerEvents: "none" }}
          />
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
            {showArcs ? (
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${effectiveViewportSize.width} ${effectiveViewportSize.height}`}
                preserveAspectRatio="none"
                style={{ position: "absolute", inset: 0, overflow: "visible" }}
              >
                {eventArcs.map((flow) => {
                const from = projectToScreen(flow.from.lon, flow.from.lat, viewState, effectiveViewportSize);
                const to = projectToScreen(flow.to.lon, flow.to.lat, viewState, effectiveViewportSize);
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const distance = Math.hypot(dx, dy);
                if (!Number.isFinite(distance) || distance < 10) return null;

                const unitX = dx / distance;
                const unitY = dy / distance;
                const normalX = -unitY;
                const normalY = unitX;
                const curvatureSign = (flow.id.length + flow.actorNation.length) % 2 === 0 ? -1 : 1;
                const arcLift = Math.max(24, Math.min(160, distance * 0.18));
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                const controlX = midX + normalX * arcLift * curvatureSign;
                const controlY = midY + normalY * arcLift * curvatureSign;
                const arcPath = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
                const strokeWidth = Math.min(3.5, 1 + flow.confidence * 2);
                const color = nationalityColorMap[flow.actorNation] ?? "#7dd3fc";

                return (
                  <g key={flow.id} opacity={0.9}>
                    <path d={arcPath} stroke={color} strokeWidth={strokeWidth + 1.2} opacity={0.14} fill="none" />
                    <path
                      d={arcPath}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${8 + strokeWidth * 3} ${14 + strokeWidth * 3}`}
                      className="actor-target-flow-dash"
                      style={{ animationDuration: `${Math.max(1.6, 3.1 - flow.confidence * 1.2)}s` }}
                      fill="none"
                    />
                  </g>
                );
                })}
              </svg>
            ) : null}
            {/* Event markers are projected manually to screen space so they stay interactive and visible across maplibre quirks. */}
            {clusters
              .filter((cluster) => cluster.events.length === 1 && cluster.id !== expandedClusterId)
              .map((cluster) => {
                const event = cluster.events[0]!;
                const EventIcon = getEventIcon(event);
                const color = getEventColor(event);
                const highlight = buildHighlightState(event, selectedEvent);
                const screen = projectToScreen(event.lon, event.lat, viewState, effectiveViewportSize);
                const bookmarked = bookmarks.isBookmarked(event.dedupeKey);
                return (
                  <Button
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
                          : bookmarked
                            ? "rgba(255, 255, 255, 0.18)"
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
                  </Button>
                );
              })}
            {clusters
              .filter((cluster) => cluster.events.length > 1 && cluster.id !== expandedClusterId)
              .map((cluster) => {
                const screen = projectToScreen(cluster.lon, cluster.lat, viewState, effectiveViewportSize);
                return (
                  <Button
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
                  </Button>
                );
              })}
          </div>
          {expandedCluster ? (
            <div
              onClick={() => setExpandedClusterId(null)}
              className="c2-cluster-modal-backdrop"
            >
              <div onClick={(event) => event.stopPropagation()} className="c2-cluster-modal">
                <div className="c2-cluster-modal-head">
                  <strong>{expandedCluster.events.length} events in this cluster</strong>
                  <Button type="button" onClick={() => setExpandedClusterId(null)} className="c2-btn">
                    Close
                  </Button>
                </div>
                {expandedCluster.events
                  .slice()
                  .sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime())
                  .map((event) => {
                    const EventIcon = getEventIcon(event);
                    const color = getEventColor(event);
                    return (
                      <Button
                        key={`cluster-row-${event.dedupeKey}`}
                        type="button"
                        onClick={() => {
                          setSelectedEvent(event);
                          setExpandedClusterId(null);
                        }}
                        className="c2-cluster-item"
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
                      </Button>
                    );
                  })}
              </div>
            </div>
          ) : null}
          </div>
          <div className="c2-map-legend">
            <div className="c2-legend-item">
              <span style={{ border: "1px solid #7ee7ff" }} className="c2-legend-dot" />
              <span>Actor match</span>
            </div>
            <div className="c2-legend-item">
              <span style={{ border: "1px solid #ffd27c" }} className="c2-legend-dot" />
              <span>Target match</span>
            </div>
            {Object.entries(nationalityColorMap).map(([nation, color]) => (
              <div key={nation} className="c2-legend-item">
                <span style={{ background: color }} className="c2-legend-dot" />
                <span>{nation}</span>
              </div>
            ))}
            <div className="c2-legend-meta">
              Layer plugins: {mapOverlayLayers.length} active / {primaryLayers.length + optionalLayers.length} available
            </div>
          </div>
        </div>
        <aside className="c2-detail-column">
          <DetailDrawer
            event={selectedEvent}
            isBookmarked={selectedEvent ? bookmarks.isBookmarked(selectedEvent.dedupeKey) : false}
            onToggleBookmark={bookmarks.toggleBookmark}
          />
        </aside>
      </section>
    </main>
  );
}
