"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface TimelineSliderProps {
  timestamps: number[];
  startIndex: number;
  endIndex: number;
  onChange: (nextStartIndex: number, nextEndIndex: number) => void;
}

function formatTs(millis: number): string {
  return new Date(millis).toLocaleString();
}

export function TimelineSlider({ timestamps, startIndex, endIndex, onChange }: TimelineSliderProps) {
  // Timeline bounds are tied to available event timestamps only.
  const rangeMax = Math.max(0, timestamps.length - 1);
  const hasData = timestamps.length > 0;
  const safeStartIndex = hasData ? Math.min(Math.max(0, startIndex), rangeMax) : 0;
  const safeEndIndex = hasData ? Math.min(Math.max(safeStartIndex, endIndex), rangeMax) : 0;
  const startTs = timestamps[safeStartIndex] ?? timestamps[0] ?? 0;
  const endTs = timestamps[safeEndIndex] ?? timestamps[rangeMax] ?? startTs;
  const windowHours = Math.max(0, (endTs - startTs) / (60 * 60 * 1000));
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragMode, setDragMode] = useState<"none" | "move" | "resize-left" | "resize-right">("none");
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRange, setDragStartRange] = useState({ start: safeStartIndex, end: safeEndIndex });
  const windowWidth = Math.max(0, safeEndIndex - safeStartIndex);
  const leftPct = rangeMax > 0 ? (safeStartIndex / rangeMax) * 100 : 0;
  const widthPct = rangeMax > 0 ? (windowWidth / rangeMax) * 100 : 100;
  const pxPerIndex = useMemo(() => {
    const width = trackRef.current?.getBoundingClientRect().width ?? 1;
    return width / Math.max(1, rangeMax);
  }, [rangeMax]);

  useEffect(() => {
    if (!hasData || dragMode === "none") return;

    const onMouseMove = (event: MouseEvent) => {
      const deltaPx = event.clientX - dragStartX;
      const deltaIndex = Math.round(deltaPx / pxPerIndex);
      const original = dragStartRange;

      if (dragMode === "move") {
        const width = original.end - original.start;
        let nextStart = original.start + deltaIndex;
        nextStart = Math.max(0, Math.min(nextStart, rangeMax - width));
        onChange(nextStart, nextStart + width);
        return;
      }

      if (dragMode === "resize-left") {
        const nextStart = Math.max(0, Math.min(original.start + deltaIndex, safeEndIndex));
        onChange(nextStart, safeEndIndex);
        return;
      }

      const nextEnd = Math.min(rangeMax, Math.max(original.end + deltaIndex, safeStartIndex));
      onChange(safeStartIndex, nextEnd);
    };

    const onMouseUp = () => setDragMode("none");

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragMode, dragStartRange, dragStartX, hasData, onChange, pxPerIndex, rangeMax, safeEndIndex, safeStartIndex]);

  if (!hasData) {
    return (
      <div style={{ padding: 12, background: "var(--c2-panel)", border: "1px solid var(--c2-border)", borderRadius: 8 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Timeline window</label>
        <div style={{ color: "var(--c2-muted)" }}>No timeline range available (no records).</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, background: "var(--c2-panel)", border: "1px solid var(--c2-border)", borderRadius: 8 }}>
      <label htmlFor="timeline-track" style={{ display: "block", marginBottom: 8 }}>
        Timeline window (records-bounded)
      </label>
      <div
        id="timeline-track"
        ref={trackRef}
        style={{
          position: "relative",
          width: "100%",
          height: 28,
          borderRadius: 999,
          background: "#050505",
          border: "1px solid var(--c2-border)"
        }}
      >
        <div
          data-testid="timeline-window"
          onMouseDown={(event) => {
            event.preventDefault();
            setDragMode("move");
            setDragStartX(event.clientX);
            setDragStartRange({ start: safeStartIndex, end: safeEndIndex });
          }}
          style={{
            position: "absolute",
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            minWidth: 10,
            top: 2,
            bottom: 2,
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 999,
            cursor: "grab"
          }}
        >
          <button
            type="button"
            aria-label="Resize timeline start"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragMode("resize-left");
              setDragStartX(event.clientX);
              setDragStartRange({ start: safeStartIndex, end: safeEndIndex });
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 10,
              border: "none",
              background: "#9ca3af",
              borderRadius: "999px 0 0 999px",
              cursor: "ew-resize"
            }}
          />
          <button
            type="button"
            aria-label="Resize timeline end"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragMode("resize-right");
              setDragStartX(event.clientX);
              setDragStartRange({ start: safeStartIndex, end: safeEndIndex });
            }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 10,
              border: "none",
              background: "#9ca3af",
              borderRadius: "0 999px 999px 0",
              cursor: "ew-resize"
            }}
          />
        </div>
      </div>
      <div style={{ marginTop: 8, color: "var(--c2-muted)" }}>
        <div>Start: {formatTs(startTs)}</div>
        <div>End: {formatTs(endTs)}</div>
        <div>{windowHours.toFixed(1)}h visible range</div>
      </div>
    </div>
  );
}
