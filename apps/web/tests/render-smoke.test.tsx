import React, { type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@deck.gl/react", () => ({
  default: () => <div data-testid="deck" />
}));

vi.mock("react-map-gl/maplibre", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div data-testid="basemap">{children}</div>,
  Marker: ({ children }: { children: ReactNode }) => <div data-testid="marker">{children}</div>
}));

vi.mock("@conflict-tracker/map-layers", () => ({
  createPrimaryLayers: () => [],
  createOptionalLayers: () => [],
  createSavedViewport: (viewport: unknown) => viewport,
  getDefaultViewport: () => ({ longitude: 44.3661, latitude: 33.3152, zoom: 4, pitch: 0, bearing: 0 })
}));

vi.mock("@accelint/icons", () => ({
  Target: () => <span data-testid="target-icon" />,
  Missile: () => <span data-testid="missile-icon" />,
  Uas: () => <span data-testid="uas-icon" />,
  InterceptPoint: () => <span data-testid="intercept-icon" />
}));

import { ConflictMap } from "@/components/ConflictMap";

describe("ConflictMap", () => {
  it("renders timeline and map shell", () => {
    render(<ConflictMap events={[]} forces={[]} assets={[]} />);
    expect(screen.getByText(/Timeline window/i)).toBeInTheDocument();
    expect(screen.getByTestId("basemap")).toBeInTheDocument();
  });
});
