import { describe, expect, it } from "vitest";
import { normalizedToScreen, coverRect, clamp01 } from "@/utils/geometry";

describe("landmark mapping", () => {
  it("maps normalized coordinates with mirror and cover", () => {
    const videoW = 1280;
    const videoH = 720;
    const canvasW = 1920;
    const canvasH = 1080;
    const point = normalizedToScreen({ x: 0.25, y: 0.5 }, videoW, videoH, canvasW, canvasH);
    expect(point.x).toBeGreaterThan(0);
    expect(point.y).toBeGreaterThan(0);
  });
  it("coverRect keeps offset for equal ratio", () => {
    const layout = coverRect(16, 9, 16, 9);
    expect(layout.offsetX).toBe(0);
    expect(layout.offsetY).toBe(0);
  });
  it("clamp01", () => {
    expect(clamp01(1.2)).toBe(1);
    expect(clamp01(-0.1)).toBe(0);
  });
});
