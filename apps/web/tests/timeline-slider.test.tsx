import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimelineSlider } from "@/components/TimelineSlider";

describe("TimelineSlider", () => {
  it("updates bounds through resize handles", () => {
    const onChange = vi.fn();
    const timestamps = [
      new Date("2026-03-05T00:00:00.000Z").getTime(),
      new Date("2026-03-05T06:00:00.000Z").getTime(),
      new Date("2026-03-05T12:00:00.000Z").getTime()
    ];

    render(<TimelineSlider timestamps={timestamps} startIndex={0} endIndex={2} onChange={onChange} />);

    fireEvent.mouseDown(screen.getByRole("button", { name: /Resize timeline start/i }), { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 120 });
    fireEvent.mouseUp(window);
    expect(onChange).toHaveBeenCalled();
  });
});
