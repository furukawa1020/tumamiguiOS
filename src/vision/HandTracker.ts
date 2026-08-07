import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
  HandLandmarkerOptions,
} from "@mediapipe/tasks-vision";
import { APP_CONFIG } from "@/config";
import { toFloat } from "@/utils/geometry";

type Delegate = "GPU" | "CPU";

const HAND_OPTIONS: Omit<HandLandmarkerOptions, "baseOptions"> = {
  runningMode: "VIDEO",
  numHands: 2,
  minHandDetectionConfidence: 0.35,
  minHandPresenceConfidence: 0.35,
  minTrackingConfidence: 0.35,
};

const createTracker = async (
  assetsPath: string,
  modelPath: string,
  delegate: Delegate,
): Promise<HandLandmarker> => {
  const fileset = await FilesetResolver.forVisionTasks(assetsPath);
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: modelPath,
      delegate,
    },
    ...HAND_OPTIONS,
  });
};

export class HandTracker {
  private task: HandLandmarker | null = null;
  private useDelegate: Delegate = "GPU";

  constructor(private readonly modelPath: string, private readonly wasmPath: string) {}

  async init(): Promise<void> {
    this.task = await this.createWithFallback();
  }

  private async createWithFallback(): Promise<HandLandmarker> {
    try {
      const task = await createTracker(this.wasmPath, this.modelPath, "GPU");
      this.useDelegate = "GPU";
      return task;
    } catch (error) {
      const task = await createTracker(this.wasmPath, this.modelPath, "CPU");
      this.useDelegate = "CPU";
      return task;
    }
  }

  getDelegate(): Delegate {
    return this.useDelegate;
  }

  async detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number,
  ): Promise<HandLandmarkerResult | null> {
    if (!this.task) {
      return null;
    }
    return this.task.detectForVideo(video, timestampMs) as Promise<HandLandmarkerResult> | HandLandmarkerResult;
  }

  get configured(): boolean {
    return this.task !== null;
  }

  async close(): Promise<void> {
    if (!this.task) {
      return;
    }
    this.task.close();
    this.task = null;
  }
}
