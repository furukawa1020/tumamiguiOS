export interface Point {
  x: number;
  y: number;
}

export interface CoverRect {
  drawnWidth: number;
  drawnHeight: number;
  offsetX: number;
  offsetY: number;
}

export const toFloat = (value: number): number =>
  Number.isFinite(value) ? value : 0;

export const clamp = (value: number, minValue: number, maxValue: number): number =>
  Number.isFinite(value) ? Math.max(minValue, Math.min(maxValue, value)) : minValue;

export const clamp01 = (value: number): number => clamp(value, 0, 1);

export const distance = (a: Point, b: Point): number => {
  const dx = toFloat(a.x) - toFloat(b.x);
  const dy = toFloat(a.y) - toFloat(b.y);
  return Math.hypot(dx, dy);
}

export const midpoint = (a: Point, b: Point): Point => ({
  x: (toFloat(a.x) + toFloat(b.x)) / 2,
  y: (toFloat(a.y) + toFloat(b.y)) / 2,
});

export const lerp = (from: number, to: number, alpha: number): number =>
  toFloat(from) + (toFloat(to) - toFloat(from)) * clamp(alpha, 0, 1);

export const lerpPoint = (from: Point, to: Point, alpha: number): Point => ({
  x: lerp(from.x, to.x, alpha),
  y: lerp(from.y, to.y, alpha),
});

export const scalePoint = (point: Point, scale: number): Point => ({
  x: toFloat(point.x) * scale,
  y: toFloat(point.y) * scale,
});

export const addPoint = (a: Point, b: Point): Point => ({
  x: toFloat(a.x) + toFloat(b.x),
  y: toFloat(a.y) + toFloat(b.y),
});

export const subPoint = (a: Point, b: Point): Point => ({
  x: toFloat(a.x) - toFloat(b.x),
  y: toFloat(a.y) - toFloat(b.y),
});

export const pointInEllipse = (
  point: Point,
  center: Point,
  radiusX: number,
  radiusY: number,
): boolean => {
  const dx = toFloat(point.x) - toFloat(center.x);
  const dy = toFloat(point.y) - toFloat(center.y);
  const rx = Math.max(1, Math.abs(radiusX));
  const ry = Math.max(1, Math.abs(radiusY));
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
};

export const coverRect = (
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): CoverRect => {
  const safeVideoWidth = Math.max(1, toFloat(videoWidth));
  const safeVideoHeight = Math.max(1, toFloat(videoHeight));
  const safeCanvasWidth = Math.max(1, toFloat(canvasWidth));
  const safeCanvasHeight = Math.max(1, toFloat(canvasHeight));

  const videoAspect = safeVideoWidth / safeVideoHeight;
  const canvasAspect = safeCanvasWidth / safeCanvasHeight;

  if (videoAspect > canvasAspect) {
    const drawnHeight = safeCanvasHeight;
    const drawnWidth = safeCanvasHeight * videoAspect;
    return {
      drawnWidth,
      drawnHeight,
      offsetX: (safeCanvasWidth - drawnWidth) / 2,
      offsetY: 0,
    };
  }

  const drawnWidth = safeCanvasWidth;
  const drawnHeight = safeCanvasWidth / videoAspect;
  return {
    drawnWidth,
    drawnHeight,
    offsetX: 0,
    offsetY: (safeCanvasHeight - drawnHeight) / 2,
  };
};

export const normalizedToScreen = (
  normalized: Point,
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): Point => {
  const safeX = clamp01(toFloat(normalized.x));
  const safeY = clamp01(toFloat(normalized.y));

  const layout = coverRect(videoWidth, videoHeight, canvasWidth, canvasHeight);
  return {
    x: layout.offsetX + (1 - safeX) * layout.drawnWidth,
    y: layout.offsetY + safeY * layout.drawnHeight,
  };
};

export const clampPointInside = (point: Point, width: number, height: number): Point => {
  return {
    x: clamp(toFloat(point.x), 0, Math.max(0, width)),
    y: clamp(toFloat(point.y), 0, Math.max(0, height)),
  };
};
