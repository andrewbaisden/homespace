import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";
import { formatGBP } from "@/lib/money";

describe("UI primitives", () => {
  it("renders a badge", () => {
    render(<Badge>Kitchen</Badge>);
    expect(screen.getByText("Kitchen")).toBeInTheDocument();
  });

  it("formats property totals for display", () => {
    expect(formatGBP(2042000)).toMatch(/20,420\.00/);
  });
});
