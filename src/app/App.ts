import { createInitialState, type AppState } from "@/app/AppState";
import { CameraController } from "@/camera/CameraController";
import { VisionController } from "@/vision/VisionController";
import type { InferenceSnapshot } from "@/vision/types";
import { PinchStateMachine } from "@/interaction/PinchStateMachine";
import { MouthStateMachine } from "@/interaction/MouthStateMachine";
import { DragController } from "@/interaction/DragController";
import { EatController } from "@/interaction/EatController";
import { PointerInputController } from "@/interaction/PointerInputController";
import { formatError } from "@/ui/ErrorUI";
import { nowMs } from "@/utils/timing";

interface AppOptions {
  video: HTMLVideoElement;
  canvasElement: HTMLElement;
}

type AppStateListener = (state: AppState) => void;

export class App {
  private state: AppState;
  private readonly onState: AppStateListener;
  private readonly camera: CameraController;
  private vision: VisionController | null = null;
  private latest: InferenceSnapshot | null = null;
  private lastStep = nowMs();
  private pointer: PointerInputController;
  private overlayText = "Ready";
  private pausedByVisibility = false;

  private pinchMachine: PinchStateMachine = new PinchStateMachine();
  private mouthMachine: MouthStateMachine = new MouthStateMachine();
  private dragController: DragController = new DragController();
  private eatController: EatController = new EatController();

  constructor(
    private readonly options: AppOptions,
    private readonly query: URLSearchParams,
    onState: AppStateListener,
  ) {
    const viewport = {
      width: Math.max(1, options.canvasElement.clientWidth || window.innerWidth),
      height: Math.max(1, options.canvasElement.clientHeight || window.innerHeight),
    };
    this.state = createInitialState(viewport);
    this.pointer = new PointerInputController(document.body, () => ({
      width: Math.max(1, window.innerWidth),
      height: Math.max(1, window.innerHeight),
    }));
    this.onState = onState;
    this.camera = new CameraController(options.video);

    if (query.get("mode") === "pointer") {
      void this.startPointerMode();
    }

    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    this.emit();
  }

  get currentState(): AppState {
    return this.state;
  }

  get overlayStatus(): string {
    if (this.state.errorMessage) {
      return this.state.errorMessage;
    }
    return this.overlayText;
  }

  async startCameraMode(): Promise<void> {
    this.resetControllers();
    await this.stopRuntime();

    this.state.mode = "camera";
    this.state.errorMessage = null;
    this.overlayText = "Starting camera and mediapipe...";
    this.emit();

    try {
      await this.camera.start();
      this.vision = new VisionController(this.options.video, (snapshot) => {
        this.latest = snapshot;
        if (snapshot.face) {
          this.state.mouthCenter = snapshot.face.mouthCenter;
          this.state.mouthRadiusX = Math.max(16, snapshot.face.mouthRadiusX);
          this.state.mouthRadiusY = Math.max(12, snapshot.face.mouthRadiusY);
          this.state.mouthVisible = true;
        } else {
          this.state.mouthVisible = false;
        }
      });
      await this.vision.init();
      this.vision.start();
      this.overlayText = "Camera mode is active.";
      this.emit();
    } catch (error) {
      this.state.errorMessage = formatError(error);
      this.state.mode = "error";
      this.overlayText = this.state.errorMessage;
      await this.stopRuntime();
      this.emit();
    }
  }

  async startPointerMode(): Promise<void> {
    this.resetControllers();
    await this.stopRuntime();
    this.state.mode = "pointer";
    this.state.errorMessage = null;
    this.overlayText = "Pointer mode is active.";
    this.emit();
  }

  async stop(): Promise<void> {
    await this.stopRuntime();
    this.state.mode = "idle";
    this.emit();
  }

  async destroy(): Promise<void> {
    await this.stop();
    this.pointer.dispose();
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }

  reset(): void {
    const nextMode = this.state.mode === "error" ? "idle" : this.state.mode;
    const next = createInitialState({
      width: Math.max(1, window.innerWidth),
      height: Math.max(1, window.innerHeight),
    });
    next.mode = nextMode;
    this.state = next;
    this.resetControllers();
    this.latest = null;
    this.overlayText = "Reset.";
    this.emit();
  }

  step(timestamp: number): void {
    const now = Number.isFinite(timestamp) ? timestamp : nowMs();
    const dt = Math.min(0.033, Math.max(0, now - this.lastStep) / 1000);
    this.lastStep = now;

    if (this.state.mode === "idle" || this.state.mode === "error") {
      this.emit();
      return;
    }

    if (this.state.mode === "camera") {
      this.stepCamera(now, dt);
      return;
    }

    if (this.state.mode === "pointer") {
      this.stepPointer(now, dt);
    }
  }

  private stepCamera(now: number, dt: number): void {
    const hands = this.latest?.hands ?? [];
    const hand = hands[0] ?? null;

    const pinch = this.pinchMachine.update({
      ratio: hand ? hand.ratio : null,
      now,
      available: hand !== null,
    });

    const pinchPosition = hand ? hand.screen.pinchMidpoint : this.state.pinchPoint;
    const drag = this.dragController.update({
      now,
      dt,
      icons: this.state.icons,
      pinchPosition,
      pinchState: pinch.state,
      canGrab: pinch.state === "PINCHED",
      handId: hand?.id ?? null,
      handLost: !hand || pinch.state === "LOST",
    });
    this.state.heldIconId = drag.heldIconId;
    this.state.pinchPoint = pinchPosition;
    this.state.pinchState = pinch.state;

    const face = this.latest?.face ?? null;
    const mouth = this.mouthMachine.update({
      mouthScore: face?.score ?? 0,
      now,
      visible: face !== null,
    });

    if (face) {
      this.state.mouthCenter = face.mouthCenter;
      this.state.mouthRadiusX = Math.max(10, face.mouthRadiusX);
      this.state.mouthRadiusY = Math.max(10, face.mouthRadiusY);
      this.state.mouthVisible = true;
    } else {
      this.state.mouthVisible = false;
      this.state.mouthRadiusX = 0;
      this.state.mouthRadiusY = 0;
      this.state.mouthCenter = {
        x: Math.max(0, window.innerWidth / 2),
        y: Math.max(0, window.innerHeight / 2),
      };
    }

    const eat = this.eatController.update({
      mouthCenter: this.state.mouthCenter,
      mouthRadiusX: this.state.mouthRadiusX,
      mouthRadiusY: this.state.mouthRadiusY,
      mouthOpen: mouth.isOpen,
      faceDetected: face !== null,
      heldIconId: this.state.heldIconId,
      icons: this.state.icons,
      now,
    });

    if (eat.consumedId) {
      this.overlayText = `Consumed ${eat.consumedId}`;
    } else if (drag.shouldRelease) {
      this.overlayText = "Release and keep pinching to grab another icon.";
    } else if (this.state.heldIconId) {
      this.overlayText = "Holding icon. Open your mouth to consume.";
    } else {
      this.overlayText = "Use pinch gesture to grab an icon.";
    }

    this.state.completed = eat.allConsumed;
    this.emit();

    if (eat.consumedId) {
      this.state.icons = this.state.icons.map((icon) => icon);
    }

    if (drag.shouldRelease) {
      this.pinchMachine.setRearmRequired();
    }
  }

  private stepPointer(now: number, dt: number): void {
    const hand = this.pointer.hand;
    this.pinchMachine.update({
      ratio: hand.open ? 1 : 0.12,
      now,
      available: true,
    });
    const isPointerPressed = !hand.open;
    const pointerPinchState = isPointerPressed ? "PINCHED" : "OPEN";

    const drag = this.dragController.update({
      now,
      dt,
      icons: this.state.icons,
      pinchPosition: hand.position,
      pinchState: pointerPinchState,
      canGrab: isPointerPressed,
      handId: hand.handId,
      handLost: false,
    });

    this.state.pinchPoint = hand.position;
    this.state.pinchState = pointerPinchState;
    this.state.heldIconId = drag.heldIconId;

    const mouth = this.mouthMachine.update({
      mouthScore: 0,
      now,
      visible: false,
    });

    const eat = this.eatController.update({
      mouthCenter: this.state.mouthCenter,
      mouthRadiusX: this.state.mouthRadiusX,
      mouthRadiusY: this.state.mouthRadiusY,
      mouthOpen: mouth.isOpen,
      faceDetected: false,
      heldIconId: this.state.heldIconId,
      icons: this.state.icons,
      now,
    });

    if (eat.allConsumed) {
      this.state.completed = true;
      this.overlayText = "Completed.";
    } else if (drag.heldIconId) {
      this.overlayText = "Drag the held icon.";
    } else {
      this.overlayText = "Click or touch the canvas to pinch and drag.";
    }

    this.emit();

    if (drag.shouldRelease) {
      this.pinchMachine.clearRearmRequired();
    }
  }

  private async stopRuntime(): Promise<void> {
    this.vision?.stop();
    await this.vision?.dispose();
    this.vision = null;
    this.camera.stop();
    this.latest = null;
    this.state.mouthVisible = false;
  }

  private handleVisibilityChange = async (): Promise<void> => {
    if (document.hidden) {
      if (this.state.mode === "camera") {
        this.pausedByVisibility = true;
        await this.stopRuntime();
      }
      return;
    }
    if (this.pausedByVisibility && this.state.mode === "camera") {
      this.pausedByVisibility = false;
      void this.startCameraMode();
    }
  };

  private resetControllers(): void {
    this.pinchMachine = new PinchStateMachine();
    this.mouthMachine = new MouthStateMachine();
    this.dragController = new DragController();
    this.eatController = new EatController();
  }

  private emit(): void {
    this.onState(this.state);
  }
}
