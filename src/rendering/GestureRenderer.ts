import type { Point } from "@/utils/geometry";

export const drawPinchHint = (p: p5, index: number, thumb: Point, indexTip: Point, state: string): void => {
  p.push();
  p.stroke(255, 255, 255, 180);
  p.strokeWeight(2);
  p.line(thumb.x, thumb.y, indexTip.x, indexTip.y);
  p.fill("rgba(255,255,255,0.8)");
  p.noStroke();
  p.ellipse(thumb.x, thumb.y, 8, 8);
  p.ellipse(indexTip.x, indexTip.y, 8, 8);
  p.noFill();
  p.stroke(`rgba(255,255,255,${state === "PINCHED" ? 1 : 0.35})`);
  p.strokeWeight(state === "PINCHED" ? 3 : 2);
  p.arc(thumb.x, thumb.y, 16, 16, 0, Math.PI * 2);
  p.pop();
};

export const drawMouthHint = (
  p: p5,
  center: Point,
  radiusX: number,
  radiusY: number,
  isOpen: boolean,
): void => {
  if (!Number.isFinite(radiusX) || !Number.isFinite(radiusY) || radiusX <= 0 || radiusY <= 0) {
    return;
  }
  p.push();
  p.noFill();
  p.stroke(isOpen ? "rgba(255, 220, 120, 0.8)" : "rgba(240, 200, 90, 0.45)");
  p.strokeWeight(2);
  p.drawingContext.setLineDash(isOpen ? [4, 6] : []);
  p.ellipse(center.x, center.y, radiusX * 2, radiusY * 2);
  p.pop();
};
