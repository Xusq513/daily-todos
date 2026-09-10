import { describe, it, expect } from "vitest";
import { calculateSnappedPosition } from "../utils/tauriBridge";

describe("calculateSnappedPosition", () => {
  const monitor = {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
  };

  it("snaps to left edge when within threshold", () => {
    const win = { x: 20, y: 300, width: 360, height: 480 };
    const res = calculateSnappedPosition(win, monitor, 32);
    expect(res.snapped).toBe(true);
    expect(res.x).toBe(0);
    expect(res.y).toBe(300);
  });

  it("snaps to right edge when right border is within threshold", () => {
    // 1920 - 360 = 1560; set x = 1550 (distance 10 <= 32)
    const win = { x: 1550, y: 300, width: 360, height: 480 };
    const res = calculateSnappedPosition(win, monitor, 32);
    expect(res.snapped).toBe(true);
    expect(res.x).toBe(1560);
    expect(res.y).toBe(300);
  });

  it("snaps to top and left corner simultaneously", () => {
    const win = { x: 15, y: 25, width: 360, height: 480 };
    const res = calculateSnappedPosition(win, monitor, 32);
    expect(res.snapped).toBe(true);
    expect(res.x).toBe(0);
    expect(res.y).toBe(0);
  });

  it("does not snap when far from edges", () => {
    const win = { x: 500, y: 500, width: 360, height: 480 };
    const res = calculateSnappedPosition(win, monitor, 32);
    expect(res.snapped).toBe(false);
    expect(res.x).toBe(500);
    expect(res.y).toBe(500);
  });
});
