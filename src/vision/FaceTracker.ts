import {
  FilesetResolver,
  FaceLandmarker,
  FaceLandmarkerResult,
  FaceLandmarkerOptions,
} from "@mediapipe/tasks-vision";

type Delegate = "GPU" | "CPU";

const FACE_OPTIONS: Omit<FaceLandmarkerOptions, "baseOptions"> = {
  runningMode: "VIDEO",
  numFaces: 1,
  minFaceDetectionConfidence: 0.5,
  minFacePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  outputFaceBlendshapes: true,
  outputFacialTransformationMatrixes: false,
};

const createTracker = async (
  assetsPath: string,
  modelPath: string,
  delegate: Delegate,
): Promise<FaceLandmarker> => {
  const fileset = await FilesetResolver.forVisionTasks(assetsPath);
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: modelPath,
      delegate,
    },
    ...FACE_OPTIONS,
  });
};

export class FaceTracker {
  private task: FaceLandmarker | null = null;
  private useDelegate: Delegate = "GPU";

  constructor(private readonly modelPath: string, private readonly wasmPath: string) {}

  async init(): Promise<void> {
    this.task = await this.createWithFallback();
  }

  private async createWithFallback(): Promise<FaceLandmarker> {
    try {
      const task = await createTracker(this.wasmPath, this.modelPath, "GPU");
      this.useDelegate = "GPU";
      return task;
    } catch {
      const task = await createTracker(this.wasmPath, this.modelPath, "CPU");
      this.useDelegate = "CPU";
      return task;
    }
  }

  async detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number,
  ): Promise<FaceLandmarkerResult | null> {
    if (!this.task) {
      return null;
    }
    return this.task.detectForVideo(video, timestampMs) as Promise<FaceLandmarkerResult> | FaceLandmarkerResult;
  }

  getDelegate(): Delegate {
    return this.useDelegate;
  }

  async close(): Promise<void> {
    if (!this.task) {
      return;
    }
    this.task.close();
    this.task = null;
  }
}
