"use client";

import React, { type ChangeEvent } from "react";
import * as DT from "@accelint/design-toolkit";

const Slider = (DT as any).Slider ?? "input";

interface TimelineSliderProps {
  value: number;
  max: number;
  onChange: (next: number) => void;
}

export function TimelineSlider({ value, max, onChange }: TimelineSliderProps) {
  // Simple control for analysts to trim the map to recent activity.
  return (
    <div style={{ padding: 12, background: "#182332", border: "1px solid #2a3a52", borderRadius: 8 }}>
      <label htmlFor="timeline" style={{ display: "block", marginBottom: 8 }}>
        Timeline window (hours)
      </label>
      <Slider
        id="timeline"
        type="range"
        min={6}
        max={max}
        step={1}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
      />
      <div style={{ marginTop: 6, color: "#8ba0c0" }}>{value}h visible range</div>
    </div>
  );
}
