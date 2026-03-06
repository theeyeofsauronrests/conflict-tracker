import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Event } from "@conflict-tracker/data-model";
import { EventsTableView } from "@/components/EventsTableView";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock })
}));

const sampleEvents: Event[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    eventType: "strike",
    eventTime: "2026-03-05T10:00:00.000Z",
    confidence: 0.8,
    actorNationality: "iran",
    targetNationality: "israel",
    rawText: "Strike report",
    dedupeKey: "strike-1",
    lon: 50,
    lat: 30,
    sources: [{ url: "https://example.com/a", provider: "example" }]
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    eventType: "intercept",
    eventTime: "2026-03-05T11:00:00.000Z",
    confidence: 0.6,
    actorNationality: "israel",
    targetNationality: "iran",
    rawText: "Intercept report",
    dedupeKey: "intercept-1",
    lon: 51,
    lat: 31,
    sources: [{ url: "https://example.com/b", provider: "example" }]
  }
];

describe("EventsTableView", () => {
  it("filters by type and routes to map on row action", () => {
    render(<EventsTableView events={sampleEvents} />);

    fireEvent.change(screen.getByLabelText(/Event Type/i), { target: { value: "intercept" } });
    expect(screen.getByText(/Showing 1 of 2 events/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /View on map/i }));
    expect(pushMock).toHaveBeenCalledWith("/?event=intercept-1");
  });
});
