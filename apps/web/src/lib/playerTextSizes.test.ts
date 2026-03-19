import { describe, it, expect } from "vitest";
import { playerTextSizes } from "./playerTextSizes.ts";

describe("playerTextSizes", () => {
  it("1 player uses div=1 (largest sizes)", () => {
    const sizes = playerTextSizes(1);
    // With div=1, the clamp values should use the raw numbers
    expect(sizes.score).toContain("2.50rem");
    expect(sizes.name).toContain("0.70rem");
    expect(sizes.stat).toContain("0.75rem");
  });

  it("2 players uses same divisor as 1 (div=1)", () => {
    const sizes1 = playerTextSizes(1);
    const sizes2 = playerTextSizes(2);
    expect(sizes1).toEqual(sizes2);
  });

  it("3-4 players use div=1.4 (medium sizes)", () => {
    const sizes3 = playerTextSizes(3);
    const sizes4 = playerTextSizes(4);
    expect(sizes3).toEqual(sizes4);

    // With div=1.4, score clamp min should be 2.5/1.4 = 1.79
    expect(sizes3.score).toContain("1.79rem");
    // name: 0.7/1.4 = 0.50
    expect(sizes3.name).toContain("0.50rem");
  });

  it("5-6 players use div=2", () => {
    const sizes5 = playerTextSizes(5);
    const sizes6 = playerTextSizes(6);
    expect(sizes5).toEqual(sizes6);

    // With div=2, score clamp min should be 2.5/2 = 1.25
    expect(sizes5.score).toContain("1.25rem");
  });

  it("7+ players use div=2.8 (smallest sizes)", () => {
    const sizes7 = playerTextSizes(7);
    const sizes10 = playerTextSizes(10);
    expect(sizes7).toEqual(sizes10);

    // With div=2.8, score clamp min should be 2.5/2.8 = 0.89
    expect(sizes7.score).toContain("0.89rem");
  });

  it("returns object with name, score, stat keys all containing clamp", () => {
    const sizes = playerTextSizes(3);
    expect(sizes).toHaveProperty("name");
    expect(sizes).toHaveProperty("score");
    expect(sizes).toHaveProperty("stat");
    expect(sizes.name).toContain("clamp(");
    expect(sizes.score).toContain("clamp(");
    expect(sizes.stat).toContain("clamp(");
  });
});
