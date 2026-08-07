import { APP_CONFIG } from "@/config";
import { buildAssetUrl } from "@/utils/assetUrl";
import {
  FACE_LANDMARK_INDEX,
  HAND_LANDMARK_INDEX,
  getLandmarkPoint,
} from "@/vision/landmarkMapping";
import { HandTracker } from "@/vision/HandTracker";
import { FaceTracker } from "@/vision/FaceTracker";
import { clamp01, distance, midpoint, normalizedToScreen } from "@/utils/geometry";
import type { InferenceSnapshot, HandTrack, FaceTrack } from "@/vision/types";
import { InferenceScheduler } from "@/vision/InferenceScheduler";

const FALLBACK_HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FALLBACK_FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type VisionCallback = (snapshot: InferenceSnapshot) => void;

export class VisionController {
  private handTracker: HandTracker | null = null;
  private faceTracker: FaceTracker | null = null;
  private scheduler: InferenceScheduler | null = null;
  private lastVideoTime = -1;
  private lastHandTime = -Infinity;
  private lastFaceTime = -Infinity;
  private lastHandResult: Awaited<ReturnType<HandTracker["detectForVideo"]>> | null = null;
  private lastFaceResult: Awaited<ReturnType<FaceTracker["detectForVideo"]>> | null = null;

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly onUpdate: VisionCallback,
  ) {}

  async init(): Promise<void> {
    const modelBase = buildAssetUrl("mediapipe/models");
    const wasmBases = this.getWasmBaseCandidates();
    this.handTracker = await this.createHandTracker(
      [`${modelBase}/hand_landmarker.task`, FALLBACK_HAND_MODEL],
      wasmBases,
    );
    this.faceTracker = await this.createFaceTracker(
      [`${modelBase}/face_landmarker.task`, FALLBACK_FACE_MODEL],
      wasmBases,
    );
  }

  private getWasmBaseCandidates(): string[] {
    const localWasm = buildAssetUrl("mediapipe/wasm");
    const cdnWasmCandidates = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm",
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/latest/wasm",
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      "https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm",
      "https://unpkg.com/@mediapipe/tasks-vision/latest/wasm",
      "https://unpkg.com/@mediapipe/tasks-vision@latest/wasm",
    ];
    const unique = [...new Set([localWasm, ...cdnWasmCandidates])];
    return unique;
  }

  private async createHandTracker(modelCandidates: string[], wasmCandidates: string[]): Promise<HandTracker> {
    let lastError: unknown = null;
    for (const model of modelCandidates) {
      for (const wasmBase of wasmCandidates) {
        const tracker = new HandTracker(model, wasmBase);
        try {
          await tracker.init();
          return tracker;
        } catch (error) {
          lastError = error;
          await tracker.close();
        }
      }
    }
    throw lastError ?? new Error("Failed to initialize hand tracker");
  }

  private async createFaceTracker(modelCandidates: string[], wasmCandidates: string[]): Promise<FaceTracker> {
    let lastError: unknown = null;
    for (const model of modelCandidates) {
      for (const wasmBase of wasmCandidates) {
        const tracker = new FaceTracker(model, wasmBase);
        try {
          await tracker.init();
          return tracker;
        } catch (error) {
          lastError = error;
          await tracker.close();
        }
      }
    }
    throw lastError ?? new Error("Failed to initialize face tracker");
  }

  start(): void {
    if (!this.handTracker || !this.faceTracker) {
      return;
    }
    const minInterval = 1000 / APP_CONFIG.handInferenceFps;
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
    const handInterval = 1000 / APP_CONFIG.handInferenceFps;
    const faceInterval = 1000 / APP_CONFIG.faceInferenceFps;

    const shouldRunHand = nowMs - this.lastHandTime >= handInterval;
    const shouldRunFace = nowMs - this.lastFaceTime >= faceInterval;

    const handResult = shouldRunHand
      ? await this.handTracker.detectForVideo(this.video, nowMs)
      : this.lastHandResult;
    const faceResult = shouldRunFace
      ? await this.faceTracker.detectForVideo(this.video, nowMs)
      : this.lastFaceResult;

    if (shouldRunHand) {
      this.lastHandTime = nowMs;
      this.lastHandResult = handResult;
    }
    if (shouldRunFace) {
      this.lastFaceTime = nowMs;
      this.lastFaceResult = faceResult;
    }
    const snapshot = this.buildSnapshot(handResult, faceResult, nowMs);
    this.onUpdate(snapshot);
  }

  private buildSnapshot(
    handResult: Awaited<ReturnType<HandTracker["detectForVideo"]>> | null,
    faceResult: Awaited<ReturnType<FaceTracker["detectForVideo"]>> | null,
    nowMs: number,
  ): InferenceSnapshot {
    const hands: HandTrack[] = [];
    const frame = {
      width: Math.max(1, this.video.videoWidth),
      height: Math.max(1, this.video.videoHeight),
      widthCanvas: window.innerWidth,
      heightCanvas: window.innerHeight,
    };

    const handLandmarks = (handResult?.landmarks ?? []) as Array<{ x: number; y: number }[]>;
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
      const screenPinchDistance = distance(screenThumbTip, screenIndexTip);
      const screenPalmLength = Math.max(distance(screenWrist, screenMiddleMcp), 1);
      const screenPalmWidth = Math.max(distance(screenIndexMcp, screenPinkyMcp), 1);
      const screenHandScale = Math.max(screenPalmLength, screenPalmWidth, 1);
      const normalizedPinchRatio = clamp01(pinchDistance / handScale);
      const screenPinchRatio = clamp01(screenPinchDistance / screenHandScale);
      const pinchRatio = Math.min(0.95 * normalizedPinchRatio, 0.95 * screenPinchRatio);

      const handTrack: HandTrack = {
        id: index,
        confidence: 1,
        normalized: {
          wrist,
          thumbTip,
          indexMcp,
          indexTip,
          middleMcp,
          pinkyMcp,
          pinchMidpoint: midpoint(thumbTip, indexTip),
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
        normalizedMidpoint: midpoint(thumbTip, indexTip),
        ratio: clamp01(pinchRatio),
        timeMs: nowMs,
        usedFallback: false,
      };
      hands.push(handTrack);
    });

    const firstFace = (faceResult?.faceLandmarks?.[0] ?? []) as Array<{ x: number; y: number }>;
    const faceBlendshapes = faceResult?.faceBlendshapes?.[0]?.categories ?? [];
    const jawOpen = faceBlendshapes.find((entry) => entry.categoryName === "jawOpen")?.score ?? 0;

    const face: FaceTrack | null =
      firstFace.length > 0
        ? (() => {
            const upperInnerLip = getLandmarkPoint(firstFace, FACE_LANDMARK_INDEX.UPPER_INNER_LIP);
            const lowerInnerLip = getLandmarkPoint(firstFace, FACE_LANDMARK_INDEX.LOWER_INNER_LIP);
            const leftMouthCorner = getLandmarkPoint(firstFace, FACE_LANDMARK_INDEX.LEFT_MOUTH_CORNER);
            const rightMouthCorner = getLandmarkPoint(firstFace, FACE_LANDMARK_INDEX.RIGHT_MOUTH_CORNER);
            const upperInnerLipScreen = normalizedToScreen(
              upperInnerLip,
              frame.width,
              frame.height,
              frame.widthCanvas,
              frame.heightCanvas,
            );
            const lowerInnerLipScreen = normalizedToScreen(
              lowerInnerLip,
              frame.width,
              frame.height,
              frame.widthCanvas,
              frame.heightCanvas,
            );
            const leftMouthCornerScreen = normalizedToScreen(
              leftMouthCorner,
              frame.width,
              frame.height,
              frame.widthCanvas,
              frame.heightCanvas,
            );
            const rightMouthCornerScreen = normalizedToScreen(
              rightMouthCorner,
              frame.width,
              frame.height,
              frame.widthCanvas,
              frame.heightCanvas,
            );
            const mouthWidth = Math.max(1, distance(leftMouthCorner, rightMouthCorner));
            const mouthHeight = Math.max(1, distance(upperInnerLip, lowerInnerLip));
            const mouthWidthScreen = Math.max(1, distance(leftMouthCornerScreen, rightMouthCornerScreen));
            const mouthHeightScreen = Math.max(1, distance(upperInnerLipScreen, lowerInnerLipScreen));
            const rawAspect = mouthHeight / mouthWidth;
            const mouthCenter = {
              x: (upperInnerLipScreen.x + lowerInnerLipScreen.x + leftMouthCornerScreen.x + rightMouthCornerScreen.x) / 4,
              y: (upperInnerLipScreen.y + lowerInnerLipScreen.y + leftMouthCornerScreen.y + rightMouthCornerScreen.y) / 4,
            };

            return {
              confidence: 1,
              upperInnerLip: upperInnerLipScreen,
              lowerInnerLip: lowerInnerLipScreen,
              leftMouthCorner: leftMouthCornerScreen,
              rightMouthCorner: rightMouthCornerScreen,
              score: Math.max(jawOpen ?? 0, clamp01(rawAspect)),
              jawOpenScore: jawOpen,
              mouthCenter,
              mouthWidth,
              mouthRadiusX: mouthWidthScreen / 2,
              mouthRadiusY: mouthHeightScreen / 2,
              mouthAspectRatio: rawAspect,
              timeMs: nowMs,
              usedFallback: false,
            };
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
