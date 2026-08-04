import { describe, expect, it } from "vitest";
import { coverRect, distance, midpoint, pointInEllipse } from "@/utils/geometry";

describe("geometry", () => {
  it("distance returns euclidean distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
  it("midpoint", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 2, y: 6 })).toEqual({ x: 1, y: 3 });
  });
  it("coverRect horizontal video", () => {
    expect(coverRect(1920, 1080, 900, 1600)).toEqual({
      drawnWidth: 1600 * (1920 / 1080),
      drawnHeight: 1600,
      offsetX: (900 - 1600 * (1920 / 1080)) / 2,
      offsetY: 0,
    });
  });
  it("coverRect vertical video", () => {
    expect(coverRect(1080, 1920, 1600, 900)).toEqual({
      drawnWidth: 1600,
      drawnHeight: 1600 / (1080 / 1920),
      offsetX: 0,
      offsetY: (900 - 1600 / (1080 / 1920)) / 2,
    });
  });
  it("pointInEllipse", () => {
    expect(pointInEllipse({ x: 0, y: 0 }, { x: 0, y: 0 }, 1, 2)).toBe(true);
    expect(pointInEllipse({ x: 2, y: 0 }, { x: 0, y: 0 }, 1, 2)).toBe(false);
  });
});
