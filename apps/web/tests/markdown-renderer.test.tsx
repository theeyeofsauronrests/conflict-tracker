import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInline } from "@/lib/markdown-renderer";

function InlineProbe({ text }: { text: string }) {
  return <p>{renderInline(text)}</p>;
}

describe("markdown-renderer", () => {
  it("renders safe http links", () => {
    render(<InlineProbe text={"See [source](https://example.com/report)"} />);
    const link = screen.getByRole("link", { name: "source" });
    expect(link).toHaveAttribute("href", "https://example.com/report");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render javascript links as anchors", () => {
    render(<InlineProbe text={"Bad [link](javascript:alert(1))"} />);
    expect(screen.queryByRole("link", { name: "link" })).not.toBeInTheDocument();
    expect(screen.getByText(/Bad/i)).toHaveTextContent("Bad link");
  });
});
