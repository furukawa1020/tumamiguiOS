import { APP_CONFIG, APP_NAME, APP_SUBCOPY } from "@/config";
import { createInitialState, type AppMode, type AppState } from "@/app/AppState";
import { CameraController } from "@/camera/CameraController";
import { VisionController } from "@/vision/VisionController";
import { InferenceSnapshot, type HandTrack, type FaceTrack } from "@/vision/types";
import { clamp, normalizedToScreen, pointInEllipse } from "@/utils/geometry";
import { DragController } from "@/interaction/DragController";
import { EatController } from "@/interaction/EatController";
import { MouthStateMachine } from "@/interaction/MouthStateMachine";
import { PinchStateMachine } from "@/interaction/PinchStateMachine";
import { PointerInputController } from "@/interaction/PointerInputController";
import { IconState } from "@/domain/types";

interface AppDependencies {
  video: HTMLVideoElement;
  canvasElement: HTMLElement;
}

interface HandStateEntry {
  stateMachine: PinchStateMachine;
  lastSeen: number;
}

const normalizeIconLayout = (point: { x: number; y: number }, width: number, height: number): { x: number; y: number } => ({
  x: clamp(point.x, 0, 1) * width,
  y: clamp(point.y, 0, 1) * height,
});

export class App {
  private state = createInitialState();
  private handTrackers = new Map<number, HandStateEntry>();
  private mouthMachine = new MouthStateMachine();
  private drag = new DragController();
  private eat = new EatController();
  private cameraController: CameraController | null = null;
  private vision: VisionController | null = null;
  private pointerController: PointerInputController | null = null;
  private latestSnapshot: InferenceSnapshot | null = null;
  private status = "";
  private onStateChange: (state: AppState) => void;
  private completedCount = 0;
  private lastFrameMs = performance.now();

  constructor(private readonly deps: AppDependencies, private readonly query: URLSearchParams, onStateChange: (state: AppState) => void) {
    this.onStateChange = onStateChange;
    this.state = createInitialState();
    const isPointerMode = query.get("mode") === "pointer";
    if (isPointerMode) {
      this.startPointerMode();
    }
  }

  get currentState(): AppState {
    return this.state;
  }

  get overlayStatus(): string {
    return this.status;
  }

  async startCameraMode(): Promise<void> {
    if (this.state.mode === "camera" || this.state.mode === "pointer") {
      await this.stopMode();
    }
    this.state.mode = "camera";
    this.state.errorMessage = null;
    this.emit();
    this.cameraController = new CameraController(this.deps.video);
    try {
      await this.cameraController.start();
      this.vision = new VisionController(this.deps.video, (snapshot) => {
        this.latestSnapshot = snapshot;
      });
      await this.vision.init();
      this.vision.start();
    } catch (error) {
      this.state.mode = "error";
      this.state.errorMessage = (error as Error).message;
      this.emit();
    }
  }

  startPointerMode(): void {
    this.state.mode = "pointer";
    this.pointerController = new PointerInputController(this.deps.canvasElement, () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    this.emit();
  }

  async stopMode(): Promise<void> {
    await this.cameraController?.stop();
    this.cameraController = null;
    await this.vision?.stop();
    await this.vision?.dispose();
    this.vision = null;
    this.pointerController?.dispose();
    this.pointerController = null;
    this.state.mode = "idle";
    this.emit();
  }

  async reset(): Promise<void> {
    await this.stopMode();
    this.state = createInitialState();
    this.drag = new DragController();
    this.eat = new EatController();
    this.handTrackers.clear();
    this.completedCount = 0;
    this.status = "リセットしました。";
    this.emit();
  }

  step(now = performance.now()): void {
    const dt = (now - this.lastFrameMs) / 1000;
    this.lastFrameMs = now;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const state = this.state;
    state.mouthVisible = false;

    let latestHands: Array<{ hand: HandTrack; handId: number; ratio: number; pinchState: "OPEN" | "CLOSING" | "PINCHED" | "OPENING" | "LOST"; position: { x: number; y: number } }> = [];

    if (this.state.mode === "pointer" && this.pointerController) {
      const hand = this.pointerController.hand;
      const handInput = {
        handId: hand.handId,
        hand: null,
        ratio: clamp(hand.open ? 0.6 : 0.1, 0.01, 1),
        pinchState: hand.open ? "OPEN" : "PINCHED",
        position: { x: hand.position.x, y: hand.position.y },
        ratioValue: hand.open ? 0.6 : 0.1,
      };
      latestHands.push({
        handId: hand.handId,
        hand: null as unknown as HandTrack,
        ratio: hand.open ? 0.6 : 0.1,
        pinchState: hand.open ? "OPEN" : "PINCHED",
        position: hand.position,
      });
    }

    const snapshot = this.latestSnapshot;
    if (snapshot && snapshot.hands.length > 0) {
      snapshot.hands.forEach((hand, index) => {
        const ratio = clamp(hand.ratio, 0.001, 1);
        const position = hand.screen.pinchMidpoint;
        const machine = this.handTrackers.get(index)?.stateMachine ?? new PinchStateMachine();
        const output = machine.update({ ratio, now, available: true });
        this.handTrackers.set(index, { stateMachine: machine, lastSeen: now });
        latestHands.push({
          hand,
          handId: index,
          ratio,
          pinchState: output.state,
          position,
        });
      });
    } else if (snapshot?.hands.length === 0) {
      this.handTrackers.forEach((entry, handId) => {
        entry.stateMachine.update({ ratio: 0, now, available: false });
      });
    }

    let currentMouthState = this.mouthMachine.update({
      mouthScore: snapshot?.face?.jawOpenScore ?? snapshot?.face?.mouthAspectRatio ?? 0,
      now,
      visible: !!snapshot?.face,
    });

    if (!snapshot?.face) {
      this.state.mouthRadiusX = 0;
      this.state.mouthRadiusY = 0;
      currentMouthState = { ...currentMouthState, state: "LOST", isOpen: false, score: 0 };
    } else {
      const face = snapshot.face;
      const mouthWidthPx = Math.max(1, (face.mouthWidth || 0.15) * width);
      const radiusX = clamp(face.mouthWidth * width * 0.55, 32, 92);
      const radiusY = clamp(face.mouthWidth * width * 0.38, 24, 72);
      const mouthCenter = normalizedToScreen(
        face.mouthCenter,
        this.deps.video.videoWidth || width,
        this.deps.video.videoHeight || height,
        width,
        height,
      );
      this.state.mouthCenter = mouthCenter;
      this.state.mouthRadiusX = radiusX;
      this.state.mouthRadiusY = radiusY;
      this.state.mouthVisible = true;
      this.state.mouthVisible = currentMouthState.isOpen || this.drag.isHolding || state.mode === "pointer";
    }

    const openHands = latestHands.filter((entry) => entry.pinchState !== "LOST");
    const hovered = new Set<string>();
    openHands.forEach((entry) => {
      const radius = APP_CONFIG.iconDefaultSize / 2 + APP_CONFIG.iconHitPadding;
      state.icons.forEach((icon) => {
        if (icon.state === IconState.EATEN || icon.state === IconState.CONSUMING) {
          return;
        }
        if (Math.abs(icon.position.x - entry.position.x) <= radius && Math.abs(icon.position.y - entry.position.y) <= radius) {
          if (entry.pinchState === "OPEN" || entry.pinchState === "OPENING") {
            hovered.add(icon.id);
          }
        }
      });
    });

    state.icons.forEach((icon) => {
      if (hovered.has(icon.id)) {
        icon.state = icon.state === IconState.IDLE ? IconState.HOVERED : icon.state;
      } else if (icon.state === IconState.HOVERED) {
        icon.state = IconState.IDLE;
      }
    });

    const pinchEntry = latestHands.find((entry) => entry.pinchState === "PINCHED");
    const dragInput = {
      now,
      dt,
      icons: state.icons,
      pinchPosition: pinchEntry?.position ?? { x: width / 2, y: height / 2 },
      pinchState: pinchEntry ? pinchEntry.pinchState : "OPEN",
      canGrab: true,
      handId: pinchEntry?.handId ?? null,
      handLost: !pinchEntry,
    };
    const dragOutput = this.drag.update(dragInput);
    state.heldIconId = dragOutput.heldIconId;

    const held = state.icons.find((icon) => icon.id === state.heldIconId) ?? null;
    if (held?.state === IconState.CONSUMING) {
      held.animationProgress = Math.min(
        1,
        held.animationProgress + dt / Math.max(1, APP_CONFIG.consumeDurationMs / 1000),
      );
    }

    if (state.mouthVisible && state.heldIconId && held) {
      const eatInput = {
        mouthCenter: state.mouthCenter,
        mouthRadiusX: state.mouthRadiusX,
        mouthRadiusY: state.mouthRadiusY,
        mouthOpen: currentMouthState.isOpen,
        faceDetected: !!snapshot?.face,
        heldIconId: state.heldIconId,
        icons: state.icons,
        now,
      };
      const eatOutput = this.eat.update(eatInput);
      if (eatOutput.consumedId) {
        this.completedCount += 1;
      }
      if (eatOutput.allConsumed) {
        this.state.completed = true;
      }
    } else {
      if (!state.mouthVisible) {
        // no-op
      }
    }

    if (state.completed) {
      this.status = `${APP_NAME}: すべてのアイコンを食べました。`;
    } else {
      const remained = this.state.icons.filter((icon) => icon.state !== IconState.EATEN).length;
      this.status = `残り: ${remained} / ${APP_CONFIG.iconCount}`;
    }
  }

  private emit(): void {
    this.onStateChange(this.state);
  }

  async destroy(): Promise<void> {
    await this.stopMode();
  }

  toScreenState(): { width: number; height: number } {
    return { width: window.innerWidth, height: window.innerHeight };
  }
}
