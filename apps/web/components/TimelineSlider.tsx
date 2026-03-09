"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/lib/ui";

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
  const [dragPxPerIndex, setDragPxPerIndex] = useState(1);
  const windowWidth = Math.max(0, safeEndIndex - safeStartIndex);
  const leftPct = rangeMax > 0 ? (safeStartIndex / rangeMax) * 100 : 0;
  const widthPct = rangeMax > 0 ? (windowWidth / rangeMax) * 100 : 100;
  const getPxPerIndex = useCallback(() => {
    const width = trackRef.current?.getBoundingClientRect().width ?? 1;
    return width / Math.max(1, rangeMax);
  }, [rangeMax]);
  const clampRange = useCallback(
    (nextStart: number, nextEnd: number): { start: number; end: number } => {
      const start = Math.min(Math.max(0, nextStart), rangeMax);
      const end = Math.min(Math.max(start, nextEnd), rangeMax);
      return { start, end };
    },
    [rangeMax]
  );

  useEffect(() => {
    if (!hasData || dragMode === "none") return;

    const onMouseMove = (event: MouseEvent) => {
      const deltaPx = event.clientX - dragStartX;
      const effectivePxPerIndex = Math.max(1, dragPxPerIndex);
      const deltaIndex = Math.round(deltaPx / effectivePxPerIndex);
      const original = dragStartRange;

      if (dragMode === "move") {
        const width = original.end - original.start;
        const maxStart = Math.max(0, rangeMax - width);
        const nextStart = Math.max(0, Math.min(original.start + deltaIndex, maxStart));
        const nextEnd = nextStart + width;
        const clamped = clampRange(nextStart, nextEnd);
        onChange(clamped.start, clamped.end);
        return;
      }

      if (dragMode === "resize-left") {
        const nextStart = Math.max(0, Math.min(original.start + deltaIndex, original.end));
        const clamped = clampRange(nextStart, original.end);
        onChange(clamped.start, clamped.end);
        return;
      }

      const nextEnd = Math.min(rangeMax, Math.max(original.end + deltaIndex, original.start));
      const clamped = clampRange(original.start, nextEnd);
      onChange(clamped.start, clamped.end);
    };

    const onMouseUp = () => setDragMode("none");

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [clampRange, dragMode, dragPxPerIndex, dragStartRange, dragStartX, hasData, onChange, rangeMax]);

  if (!hasData) {
    return (
      <div className="c2-control-surface">
        <label className="c2-control-title">Timeline window</label>
        <div className="c2-control-muted">No timeline range available (no records).</div>
      </div>
    );
  }

  return (
    <div className="c2-control-surface c2-timeline-surface">
      <div className="c2-control-head">
        <label htmlFor="timeline-track" className="c2-control-title">
          Timeline window
        </label>
        <span className="c2-control-muted">{windowHours.toFixed(1)}h visible</span>
      </div>
      <div
        id="timeline-track"
        ref={trackRef}
        className="c2-timeline-track"
      >
        <div
          data-testid="timeline-window"
          onMouseDown={(event) => {
            event.preventDefault();
            setDragMode("move");
            setDragStartX(event.clientX);
            setDragPxPerIndex(getPxPerIndex());
              setDragStartRange({ start: safeStartIndex, end: safeEndIndex });
            }}
          className="c2-timeline-window"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        >
          <Button
            type="button"
            aria-label="Resize timeline start"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragMode("resize-left");
              setDragStartX(event.clientX);
              setDragPxPerIndex(getPxPerIndex());
              setDragStartRange({ start: safeStartIndex, end: safeEndIndex });
            }}
            className="c2-timeline-handle c2-timeline-handle-left"
          />
          <Button
            type="button"
            aria-label="Resize timeline end"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragMode("resize-right");
              setDragStartX(event.clientX);
              setDragPxPerIndex(getPxPerIndex());
              setDragStartRange({ start: safeStartIndex, end: safeEndIndex });
            }}
            className="c2-timeline-handle c2-timeline-handle-right"
          />
        </div>
      </div>
      <div className="c2-control-meta">
        <div>
          <span className="c2-control-muted">Start:</span> {formatTs(startTs)}
        </div>
        <div>
          <span className="c2-control-muted">End:</span> {formatTs(endTs)}
        </div>
      </div>
    </div>
  );
}
