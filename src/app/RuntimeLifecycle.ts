import { APP_CONFIG } from "@/config";
import { CameraController } from "@/camera/CameraController";
import { VisionController } from "@/vision/VisionController";
import type { Point } from "@/utils/geometry";
import type { InferenceSnapshot } from "@/vision/types";
import type { AppState } from "@/app/AppState";
import { createInitialState } from "@/app/AppState";

export type AppRuntimeState = "idle" | "running" | "stopped" | "error";

export class RuntimeLifecycle {
  private camera: CameraController | null = null;
  private vision: VisionController | null = null;
  private onState: (state: AppState) => void;
  private appState: AppState;

  constructor(private readonly video: HTMLVideoElement, onState: (state: AppState) => void) {
    this.onState = onState;
    this.appState = createInitialState({
      width: Math.max(1, window.innerWidth),
      height: Math.max(1, window.innerHeight),
    });
  }

  get state(): AppState {
    return this.appState;
  }

  setState(next: AppState): void {
    this.appState = next;
    this.onState(next);
  }

  async startCameraMode(): Promise<void> {
    this.appState.mode = "camera";
    this.onState(this.appState);
    this.camera = new CameraController(this.video);
    try {
      await this.camera.start();
      this.vision = new VisionController(this.video, (snapshot) => {
        this.handleInference(snapshot);
      });
      await this.vision.init();
      this.vision.start();
    } catch (error) {
      this.appState.errorMessage = (error as Error).message;
      this.appState.mode = "error";
      this.onState(this.appState);
    }
  }

  private handleInference(snapshot: InferenceSnapshot): void {
    // Inference snapshot is consumed in App controller.
    this.appState.mouthVisible = !!snapshot.face;
  }

  startPointerMode(): void {
    this.stop();
    this.appState.mode = "pointer";
    this.onState(this.appState);
  }

  async stop(): Promise<void> {
    this.vision?.stop();
    this.vision?.dispose();
    this.vision = null;
    this.camera?.stop();
    this.camera = null;
    this.appState.mode = "idle";
    this.onState(this.appState);
  }

  resetState(): AppState {
    const next = createInitialState({
      width: Math.max(1, window.innerWidth),
      height: Math.max(1, window.innerHeight),
    });
    this.appState = next;
    this.onState(this.appState);
    return next;
  }

  async destroy(): Promise<void> {
    await this.stop();
  }
}
