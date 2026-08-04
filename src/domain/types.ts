import type { Point } from "@/utils/geometry";

export enum IconState {
  IDLE = "IDLE",
  HOVERED = "HOVERED",
  HELD = "HELD",
  EAT_TARGET = "EAT_TARGET",
  CONSUMING = "CONSUMING",
  EATEN = "EATEN",
}

export interface DesktopIcon {
  id: string;
  label: string;
  type: string;
  position: Point;
  initialPosition: Point;
  size: number;
  state: IconState;
  zIndex: number;
  grabOffset: Point;
  animationProgress: number;
  visualSeed: number;
}

export interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
