import { FilesetResolver, type HandLandmarkerResult, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { APP_CONFIG } from "@/config";
import { buildAssetUrl } from "@/utils/assetUrl";
import { HAND_LANDMARK_INDEX, FACE_LANDMARK_INDEX, getLandmarkPoint } from "@/vision/landmarkMapping";
import { HandTracker } from "@/vision/HandTracker";
import { FaceTracker } from "@/vision/FaceTracker";
import { clamp01, distance, midpoint, toFloat, normalizedToScreen } from "@/utils/geometry";
import type { InferenceSnapshot, HandTrack, FaceTrack } from "@/vision/types";
import { InferenceScheduler } from "@/vision/InferenceScheduler";
import { HandTrack as _unused } from "@/vision/types";

type VisionCallback = (snapshot: InferenceSnapshot) => void;

export class VisionController {
  private handTracker: HandTracker | null = null;
  private faceTracker: FaceTracker | null = null;
  private scheduler: InferenceScheduler | null = null;
  private lastVideoTime = -1;

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly onUpdate: VisionCallback,
  ) {}

  async init(): Promise<void> {
    const modelBase = buildAssetUrl("mediapipe/models");
    const handModel = `${modelBase}/hand_landmarker.task`;
    const faceModel = `${modelBase}/face_landmarker.task`;
    const wasmBase = buildAssetUrl("mediapipe/wasm");
    this.handTracker = new HandTracker(handModel, wasmBase);
    this.faceTracker = new FaceTracker(faceModel, wasmBase);
    await Promise.all([this.handTracker.init(), this.faceTracker.init()]);
  }

  start(): void {
    if (!this.handTracker || !this.faceTracker) {
      return;
    }
    const minInterval = Math.max(
      1000 / APP_CONFIG.handInferenceFps,
      1000 / APP_CONFIG.faceInferenceFps,
    );
    this.scheduler = new InferenceScheduler((time) => void this.step(time), {
      minIntervalMs: minInterval,
      running: true,
    });
    this.scheduler.start(this.video);
  }

  stop(): void {
    this.scheduler?.stop();
    this.scheduler = null;
  }

  private async step(time: number): Promise<void> {
    if (!this.handTracker || !this.faceTracker) {
      return;
    }
    if (this.video.currentTime === this.lastVideoTime) {
      return;
    }
    this.lastVideoTime = this.video.currentTime;

    const nowMs = time;
    const handResult = await this.handTracker.detectForVideo(this.video, nowMs);
    const faceResult = await this.faceTracker.detectForVideo(this.video, nowMs);
    const snapshot = this.buildSnapshot(handResult, faceResult, nowMs);
    this.onUpdate(snapshot);
  }

  private buildSnapshot(
    handResult: HandLandmarkerResult | null,
    faceResult: FaceLandmarkerResult | null,
    nowMs: number,
  ): InferenceSnapshot {
    const hands: HandTrack[] = [];
    const frame = {
      width: this.video.videoWidth || 1,
      height: this.video.videoHeight || 1,
      widthCanvas: window.innerWidth,
      heightCanvas: window.innerHeight,
    };

    const handLandmarks = (handResult?.landmarks ?? []) as Array<{
      x: number;
      y: number;
    }[]>;
    const handWorld = handResult?.worldLandmarks ?? [];
    const scores = handResult?.worldLandmarks?.map(() => 1) ?? [];

    handLandmarks.forEach((landmarks, index) => {
      const wrist = getLandmarkPoint(landmarks, HAND_LANDMARK_INDEX.WRIST);
      const thumbTip = getLandmarkPoint(landmarks, HAND_LANDMARK_INDEX.THUMB_TIP);
      const indexMcp = getLandmarkPoint(landmarks, HAND_LANDMARK_INDEX.INDEX_MCP);
      const indexTip = getLandmarkPoint(landmarks, HAND_LANDMARK_INDEX.INDEX_TIP);
      const middleMcp = getLandmarkPoint(landmarks, HAND_LANDMARK_INDEX.MIDDLE_MCP);
      const pinkyMcp = getLandmarkPoint(landmarks, HAND_LANDMARK_INDEX.PINKY_MCP);

      const screenWrist = normalizedToScreen(wrist, frame.width, frame.height, frame.widthCanvas, frame.heightCanvas);
      const screenThumbTip = normalizedToScreen(
        thumbTip,
        frame.width,
        frame.height,
        frame.widthCanvas,
        frame.heightCanvas,
      );
      const screenIndexMcp = normalizedToScreen(
        indexMcp,
        frame.width,
        frame.height,
        frame.widthCanvas,
        frame.heightCanvas,
      );
      const screenIndexTip = normalizedToScreen(
        indexTip,
        frame.width,
        frame.height,
        frame.widthCanvas,
        frame.heightCanvas,
      );
      const screenMiddleMcp = normalizedToScreen(
        middleMcp,
        frame.width,
        frame.height,
        frame.widthCanvas,
        frame.heightCanvas,
      );
      const screenPinkyMcp = normalizedToScreen(
        pinkyMcp,
        frame.width,
        frame.height,
        frame.widthCanvas,
        frame.heightCanvas,
      );

      const pinchDistance = distance(thumbTip, indexTip);
      const palmLength = distance(wrist, middleMcp);
      const palmWidth = distance(indexMcp, pinkyMcp);
      const handScale = Math.max(palmLength, palmWidth, 1e-4);

      hands.push({
        id: index,
        confidence: toFloat(handResult?.handLandmarks?.[index]?.length ? 1 : 0.8),
        normalized: {
          wrist,
          thumbTip,
          indexMcp,
          indexTip,
          middleMcp,
          pinkyMcp,
        },
        screen: {
          wrist: screenWrist,
          thumbTip: screenThumbTip,
          indexMcp: screenIndexMcp,
          indexTip: screenIndexTip,
          middleMcp: screenMiddleMcp,
          pinkyMcp: screenPinkyMcp,
          pinchMidpoint: midpoint(screenThumbTip, screenIndexTip),
        },
        ratio: clamp01(pinchDistance / handScale),
        timeMs: nowMs,
        usedFallback: false,
      });
    });

    const faceWorld = faceResult?.faceBlendshapes?.[0]?.categories ?? [];
    const jawOpen = faceWorld.find((entry) => entry.categoryName === "jawOpen")?.score;
    const face: FaceTrack | null =
      (faceResult?.faceLandmarks?.[0] ?? []).length > 0
        ? (() => {
            const landmarks = faceResult?.faceLandmarks?.[0] ?? [];
            const upperInnerLip = getLandmarkPoint(landmarks, FACE_LANDMARK_INDEX.UPPER_INNER_LIP);
            const lowerInnerLip = getLandmarkPoint(landmarks, FACE_LANDMARK_INDEX.LOWER_INNER_LIP);
            const leftMouthCorner = getLandmarkPoint(landmarks, FACE_LANDMARK_INDEX.LEFT_MOUTH_CORNER);
            const rightMouthCorner = getLandmarkPoint(landmarks, FACE_LANDMARK_INDEX.RIGHT_MOUTH_CORNER);
            const mouthWidth = Math.max(1, distance(leftMouthCorner, rightMouthCorner));
            const mouthCenter = {
              x: (upperInnerLip.x + lowerInnerLip.x + leftMouthCorner.x + rightMouthCorner.x) / 4,
              y: (upperInnerLip.y + lowerInnerLip.y + leftMouthCorner.y + rightMouthCorner.y) / 4,
            };
            const rawAspect = distance(upperInnerLip, lowerInnerLip) / mouthWidth;
            const mouthAspectRatio = Number.isFinite(rawAspect) ? rawAspect : 0;
            return {
              confidence: 1,
              upperInnerLip,
              lowerInnerLip,
              leftMouthCorner,
              rightMouthCorner,
              score: Math.max(jawOpen ?? 0, mouthAspectRatio),
              jawOpenScore: jawOpen,
              mouthCenter,
              mouthWidth,
              mouthAspectRatio,
              timeMs: nowMs,
              usedFallback: false,
            } satisfies FaceTrack;
          })()
        : null;

    return {
      hands,
      face,
      hasVideo: this.video.readyState >= 2,
      lastTimeMs: nowMs,
    };
  }

  async dispose(): Promise<void> {
    this.stop();
    await Promise.all([this.handTracker?.close(), this.faceTracker?.close()]);
    this.handTracker = null;
    this.faceTracker = null;
  }
}
