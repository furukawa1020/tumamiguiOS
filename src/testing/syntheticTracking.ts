import { APP_CONFIG } from "@/config";
import type { Point } from "@/utils/geometry";

export interface SyntheticTrack {
  t: number;
  position: Point;
  ratio: number;
}

export const createSyntheticTrajectory = (
  durationMs: number,
  start: Point,
  end: Point,
): SyntheticTrack[] => {
  const frames: SyntheticTrack[] = [];
  const interval = 16;
  const steps = Math.max(1, Math.floor(durationMs / interval));
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const ratio = i % 40 < 20 ? 0.08 : 0.55;
    frames.push({
      t: i * interval,
      position: {
        x: start.x + (end.x - start.x) * p,
        y: start.y + (end.y - start.y) * p,
      },
      ratio,
    });
  }
  return frames;
};
