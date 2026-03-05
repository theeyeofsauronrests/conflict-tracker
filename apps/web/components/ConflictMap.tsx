"use client";

import React, { useEffect, useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import type { PickingInfo } from "@deck.gl/core";
import Map, { Marker } from "react-map-gl/maplibre";
import { createPrimaryLayers, getDefaultViewport } from "@conflict-tracker/map-layers";
import type { Event, ForcePosition, AssetPosition } from "@conflict-tracker/data-model";
import * as DT from "@accelint/design-toolkit";
import { nationalityColorMap } from "@/lib/colors";
import { ensureDeckGlShaderHooks } from "@/lib/deckShaderHooks";
import { getEventColor, getEventIcon } from "@/lib/event-icons";
import { DetailDrawer } from "./DetailDrawer";
import { TimelineSlider } from "./TimelineSlider";

interface ConflictMapProps {
  events: Event[];
  forces: ForcePosition[];
  assets: AssetPosition[];
}

export function ConflictMap({ events, forces, assets }: ConflictMapProps) {
  // Ensure Deck shader hooks exist before any layer models compile.
  ensureDeckGlShaderHooks();

  // Keep the clicked event in local UI state so the drawer can show details.
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  // Users can "time travel" the map by shrinking or expanding this window.
  const [windowHours, setWindowHours] = useState(72);
  // Current time in the header helps analysts compare feed recency against "now".
  const [now, setNow] = useState(() => new Date());
  const Icon = (DT as any).Icon ?? (({ children }: { children: React.ReactNode }) => <span>{children}</span>);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Hide older events based on the selected time window.
  const filteredEvents = useMemo(() => {
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    return events.filter((event) => new Date(event.eventTime).getTime() >= cutoff);
  }, [events, windowHours]);

  // Build render layers once per relevant data change.
  const layers = useMemo(() => createPrimaryLayers([], forces, assets), [forces, assets]);
  // Start the map focused on the core area of interest.
  const viewport = useMemo(() => getDefaultViewport(), []);
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
          <strong>{now.toLocaleString()}</strong>
        </div>
        <div>
          <div style={{ color: "var(--c2-muted)", fontSize: 12, textTransform: "uppercase" }}>Data as of</div>
          <strong>{dataAsOf ? dataAsOf.toLocaleString() : "No data loaded"}</strong>
        </div>
        <div>
          <div style={{ color: "var(--c2-muted)", fontSize: 12, textTransform: "uppercase" }}>Event tally</div>
          <strong>
            {filteredEvents.length} visible / {events.length} total
          </strong>
        </div>
      </header>
      <section style={{ minWidth: 0 }}>
        <TimelineSlider value={windowHours} max={168} onChange={setWindowHours} />
        <div
          style={{
            marginTop: 12,
            height: "75vh",
            border: "1px solid var(--c2-border)",
            borderRadius: 8,
            overflow: "hidden",
            position: "relative",
            zIndex: 1
          }}
        >
          <DeckGL
            initialViewState={viewport}
            controller
            layers={layers as never}
            style={{ position: "absolute", inset: "0" }}
            getCursor={({ isHovering }) => (isHovering ? "pointer" : "grab")}
            onClick={(info: PickingInfo) => {
              // We only open the drawer for event-like objects.
              if (info.object && "eventType" in (info.object as Record<string, unknown>)) {
                setSelectedEvent(info.object as Event);
              }
            }}
          >
            {/* Basemap gives spatial context under Deck overlays. */}
            <Map
              reuseMaps
              mapStyle={darkMapStyle}
            >
              {/* Event markers use differentiated icons for fast visual triage. */}
              {filteredEvents.slice(0, 500).map((event) => {
                const EventIcon = getEventIcon(event);
                const color = getEventColor(event);
                return (
                  <Marker key={event.dedupeKey} longitude={event.lon} latitude={event.lat} anchor="center">
                    <button
                      type="button"
                      aria-label={`Select ${event.eventType} event`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        border: "1px solid #1f1f1f",
                        background: "#050505",
                        color,
                        boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
                        cursor: "pointer"
                      }}
                    >
                      <Icon>{EventIcon ? <EventIcon /> : null}</Icon>
                    </button>
                  </Marker>
                );
              })}
            </Map>
          </DeckGL>
        </div>
        {/* Legend explains nationality color coding for quick scanning. */}
        <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
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
