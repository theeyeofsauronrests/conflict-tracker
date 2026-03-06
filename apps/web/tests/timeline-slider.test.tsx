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

  it("clamps move and resize interactions to available min/max bounds", () => {
    const onChange = vi.fn();
    const timestamps = Array.from({ length: 5 }, (_, index) => new Date(`2026-03-05T0${index}:00:00.000Z`).getTime());

    render(<TimelineSlider timestamps={timestamps} startIndex={1} endIndex={3} onChange={onChange} />);

    fireEvent.mouseDown(screen.getByTestId("timeline-window"), { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 10000 });
    fireEvent.mouseUp(window);

    const moveCall = onChange.mock.calls.at(-1);
    expect(moveCall?.[0]).toBe(2);
    expect(moveCall?.[1]).toBe(4);

    fireEvent.mouseDown(screen.getByRole("button", { name: /Resize timeline start/i }), { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: -10000 });
    fireEvent.mouseUp(window);

    const resizeLeftCall = onChange.mock.calls.at(-1);
    expect(resizeLeftCall?.[0]).toBe(0);
    expect(resizeLeftCall?.[1]).toBe(3);

    fireEvent.mouseDown(screen.getByRole("button", { name: /Resize timeline end/i }), { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 10000 });
    fireEvent.mouseUp(window);

    const resizeRightCall = onChange.mock.calls.at(-1);
    expect(resizeRightCall?.[0]).toBe(1);
    expect(resizeRightCall?.[1]).toBe(4);
  });

  it("uses current track width so small drags do not jump the start bound", () => {
    const onChange = vi.fn();
    const timestamps = Array.from({ length: 5 }, (_, index) => new Date(`2026-03-05T0${index}:00:00.000Z`).getTime());

    render(<TimelineSlider timestamps={timestamps} startIndex={1} endIndex={3} onChange={onChange} />);

    const track = document.getElementById("timeline-track");
    expect(track).toBeTruthy();
    Object.defineProperty(track as HTMLElement, "getBoundingClientRect", {
      value: () => ({ width: 200 }),
      configurable: true
    });

    fireEvent.mouseDown(screen.getByRole("button", { name: /Resize timeline start/i }), { clientX: 100 });
    fireEvent.mouseMove(window, { clientX: 110 });
    fireEvent.mouseUp(window);

    const call = onChange.mock.calls.at(-1);
    expect(call?.[0]).toBe(1);
    expect(call?.[1]).toBe(3);
  });
});
