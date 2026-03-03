"use client";

import React, { useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import type { PickingInfo } from "@deck.gl/core";
import { createPrimaryLayers, getDefaultViewport } from "@conflict-tracker/map-layers";
import type { Event, ForcePosition, AssetPosition } from "@conflict-tracker/data-model";
import { nationalityColorMap } from "@/lib/colors";
import { DetailDrawer } from "./DetailDrawer";
import { TimelineSlider } from "./TimelineSlider";

interface ConflictMapProps {
  events: Event[];
  forces: ForcePosition[];
  assets: AssetPosition[];
}

export function ConflictMap({ events, forces, assets }: ConflictMapProps) {
  // Keep the clicked event in local UI state so the drawer can show details.
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  // Users can "time travel" the map by shrinking or expanding this window.
  const [windowHours, setWindowHours] = useState(72);

  // Hide older events based on the selected time window.
  const filteredEvents = useMemo(() => {
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    return events.filter((event) => new Date(event.eventTime).getTime() >= cutoff);
  }, [events, windowHours]);

  // Build render layers once per relevant data change.
  const layers = useMemo(() => createPrimaryLayers(filteredEvents, forces, assets), [filteredEvents, forces, assets]);
  // Start the map focused on the core area of interest.
  const viewport = useMemo(() => getDefaultViewport(), []);

  return (
    <main style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, padding: 16 }}>
      <section>
        <TimelineSlider value={windowHours} max={168} onChange={setWindowHours} />
        <div style={{ marginTop: 12, height: "75vh", border: "1px solid #2a3a52", borderRadius: 8, overflow: "hidden" }}>
          <DeckGL
            initialViewState={viewport}
            controller
            layers={layers as never}
            onClick={(info: PickingInfo) => {
              // We only open the drawer for event-like objects.
              if (info.object && "eventType" in (info.object as Record<string, unknown>)) {
                setSelectedEvent(info.object as Event);
              }
            }}
          />
        </div>
        {/* Legend explains nationality color coding for quick scanning. */}
        <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.entries(nationalityColorMap).map(([nation, color]) => (
            <div key={nation} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 999, background: color }} />
              <span style={{ color: "#8ba0c0", textTransform: "uppercase", fontSize: 12 }}>{nation}</span>
            </div>
          ))}
        </div>
      </section>
      <aside>
        <DetailDrawer event={selectedEvent} />
      </aside>
    </main>
  );
}
