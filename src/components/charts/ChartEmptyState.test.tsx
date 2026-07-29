import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ChartEmptyState } from "./ChartEmptyState";
import { Activity } from "lucide-react";

describe("ChartEmptyState", () => {
  it("renders the message", () => {
    render(<ChartEmptyState icon={Activity} message="No data available" />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders the icon with correct props", () => {
    const { container } = render(<ChartEmptyState icon={Activity} message="No data available" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies the correct wrapper class", () => {
    const { container } = render(<ChartEmptyState icon={Activity} message="Test" />);
    expect(container.firstChild).toHaveClass("chart-empty-state");
  });
});
