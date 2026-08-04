import type { Point } from "@/utils/geometry";

export const APP_NAME = "つまみ食いOS";
export const APP_TAGLINE = "空中でつまんで、ぱくっ。";
export const APP_SUBCOPY = "親指と人差し指でアイコンをつまみ、口へ運んで食べる体験です。";
export const APP_VERSION = "0.1.0";

export const DEFAULT_ICON_SIZE = 76;

export interface AppConfig {
  iconCount: number;
  iconMinSize: number;
  iconDefaultSize: number;
  iconMaxSize: number;
  iconHitPadding: number;
  handInferenceFps: number;
  faceInferenceFps: number;
  maxDpr: number;
  pinchCloseThreshold: number;
  pinchReleaseThreshold: number;
  pinchCloseDurationMs: number;
  pinchReleaseDurationMs: number;
  handLostTimeoutMs: number;
  mouthOpenEnterThreshold: number;
  mouthOpenExitThreshold: number;
  mouthOpenDurationMs: number;
  mouthCloseDurationMs: number;
  eatDwellDurationMs: number;
  consumeDurationMs: number;
  particleCountLimit: number;
  reducedMotionScale: number;
  cameraConstraints: MediaTrackConstraints;
  debugEnabled: boolean;
}

export const APP_CONFIG: AppConfig = {
  iconCount: 8,
  iconMinSize: 64,
  iconDefaultSize: 76,
  iconMaxSize: 92,
  iconHitPadding: 18,
  handInferenceFps: 24,
  faceInferenceFps: 12,
  maxDpr: 2,
  pinchCloseThreshold: 0.25,
  pinchReleaseThreshold: 0.38,
  pinchCloseDurationMs: 70,
  pinchReleaseDurationMs: 90,
  handLostTimeoutMs: 250,
  mouthOpenEnterThreshold: 0.28,
  mouthOpenExitThreshold: 0.16,
  mouthOpenDurationMs: 90,
  mouthCloseDurationMs: 120,
  eatDwellDurationMs: 220,
  consumeDurationMs: 420,
  particleCountLimit: 220,
  reducedMotionScale: 0.6,
  cameraConstraints: {
    video: {
      audio: false,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: "user",
    },
  },
  debugEnabled: false,
};

export const POINTER_MODE_SEED = 8737;
export const PORTABLE_UI_SEED = 1000;

export const getReducedMotionScale = (): number =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.6 : 1;

export const clampNormalized = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.5;

export const initialIconGridPoints = (): readonly Point[] => [
  { x: 0.2, y: 0.3 },
  { x: 0.45, y: 0.33 },
  { x: 0.72, y: 0.31 },
  { x: 0.22, y: 0.55 },
  { x: 0.48, y: 0.58 },
  { x: 0.75, y: 0.56 },
  { x: 0.18, y: 0.8 },
  { x: 0.53, y: 0.84 },
];
