import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { describe, it, expect } from "vitest";
import "../index.css";

import { SegmentID } from "../board/Dartboard.ts";
import { DartboardSVG } from "./DartboardSVG.tsx";

describe("DartboardSVG (browser)", () => {
  it("renders a dartboard with all segments", async () => {
    render(
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#111",
        }}
      >
        <DartboardSVG size={500} />
      </div>,
    );

    // SVG should be visible
    const svg = page.getByRole("img", { name: "Dartboard" });
    await expect.element(svg).toBeVisible();

    // Should have 80 path segments (20 sectors × 4 rings)
    const paths = document.querySelectorAll("svg path");
    expect(paths.length).toBe(80);

    // Should have 20 number labels
    const texts = document.querySelectorAll("svg text");
    expect(texts.length).toBe(20);

    // Verify some key numbers are present (use exact to avoid partial matches like "1" in "18")
    await expect.element(page.getByText("20", { exact: true })).toBeVisible();
    await expect.element(page.getByText("5", { exact: true })).toBeVisible();
    await expect.element(page.getByText("18", { exact: true })).toBeVisible();
  });

  it("fill mode: fills the segment with highlight color", async () => {
    render(
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#111",
        }}
      >
        <DartboardSVG size={500} highlightSegment={SegmentID.TRP_20} />
      </div>,
    );

    const svg = page.getByRole("img", { name: "Dartboard" });
    await expect.element(svg).toBeVisible();

    const paths = document.querySelectorAll("svg path");

    // Exactly 1 segment path should be filled with amber
    const filledPaths = Array.from(paths).filter(
      (p) =>
        p.getAttribute("fill") === "#fbbf24" &&
        p.getAttribute("opacity") !== "0.3",
    );
    expect(filledPaths.length).toBe(1);

    // A fill glow overlay should exist
    const glowPaths = Array.from(paths).filter(
      (p) =>
        p.getAttribute("fill") === "#fbbf24" &&
        p.getAttribute("opacity") === "0.3",
    );
    expect(glowPaths.length).toBe(1);
  });

  it("outline mode: draws a glowing border without filling", async () => {
    render(
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#111",
        }}
      >
        <DartboardSVG
          size={500}
          highlightSegment={SegmentID.TRP_20}
          highlightMode="outline"
        />
      </div>,
    );

    const svg = page.getByRole("img", { name: "Dartboard" });
    await expect.element(svg).toBeVisible();

    const paths = document.querySelectorAll("svg path");

    // No path should be filled with amber (outline mode keeps base color)
    const filledPaths = Array.from(paths).filter(
      (p) => p.getAttribute("fill") === "#fbbf24",
    );
    expect(filledPaths.length).toBe(0);

    // The highlighted segment should have an amber stroke
    const outlinedPaths = Array.from(paths).filter(
      (p) => p.getAttribute("stroke") === "#fbbf24",
    );
    // 1 segment path + 1 glow overlay path
    expect(outlinedPaths.length).toBe(2);
  });
});
