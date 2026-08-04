import type { Point } from "@/utils/geometry";

export interface ScreenLandmarks {
  landmarks: Point[];
}

export interface HandTrack {
  id: number;
  confidence: number;
  normalized: {
    wrist: Point;
    thumbTip: Point;
    indexMcp: Point;
    indexTip: Point;
    middleMcp: Point;
    pinkyMcp: Point;
  };
  screen: {
    wrist: Point;
    thumbTip: Point;
    indexMcp: Point;
    indexTip: Point;
    middleMcp: Point;
    pinkyMcp: Point;
    pinchMidpoint: Point;
  };
  normalizedMidpoint: Point;
  ratio: number;
  timeMs: number;
  usedFallback: boolean;
}

export interface FaceTrack {
  confidence: number;
  upperInnerLip: Point;
  lowerInnerLip: Point;
  leftMouthCorner: Point;
  rightMouthCorner: Point;
  score: number;
  jawOpenScore?: number;
  mouthCenter: Point;
  mouthWidth: number;
  mouthRadiusX: number;
  mouthRadiusY: number;
  mouthAspectRatio: number;
  timeMs: number;
  usedFallback?: boolean;
}

export interface InferenceSnapshot {
  hands: HandTrack[];
  face: FaceTrack | null;
  hasVideo: boolean;
  lastTimeMs: number;
}
