import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Event } from "@conflict-tracker/data-model";
import { EventsTableView } from "@/components/EventsTableView";

const pushMock = vi.fn();
const searchParamsMock = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsMock
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
  beforeEach(() => {
    pushMock.mockReset();
    searchParamsMock.delete("bookmarked");
    window.localStorage.clear();
  });

  it("filters by type and routes to map on row action", () => {
    render(<EventsTableView events={sampleEvents} />);

    fireEvent.change(screen.getByLabelText(/Event Type/i), { target: { value: "intercept" } });
    expect(screen.getByText(/Showing 1 of 2 events/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /View on map/i }));
    expect(pushMock).toHaveBeenCalledWith("/?event=intercept-1");
  });

  it("toggles bookmarks and supports bookmarked-only filter", () => {
    render(<EventsTableView events={sampleEvents} />);

    fireEvent.click(screen.getByRole("button", { name: /Toggle bookmark for strike-1/i }));
    expect(screen.getByText(/1 bookmarked locally/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Bookmarked only/i));
    expect(screen.getByText(/Strike report/i)).toBeInTheDocument();
    expect(screen.queryByText(/Intercept report/i)).not.toBeInTheDocument();
  });

  it("supports bookmarked deep-link filter from query params", () => {
    searchParamsMock.set("bookmarked", "1");
    window.localStorage.setItem("ct-bookmarks-v1", JSON.stringify(["intercept-1"]));

    render(<EventsTableView events={sampleEvents} />);

    expect(screen.getByText(/Showing 1 of 2 events/i)).toBeInTheDocument();
    expect(screen.getByText(/Intercept report/i)).toBeInTheDocument();
    expect(screen.queryByText(/Strike report/i)).not.toBeInTheDocument();
  });
});
