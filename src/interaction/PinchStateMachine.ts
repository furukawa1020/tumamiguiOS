import { APP_CONFIG } from "@/config";
import { clamp } from "@/utils/geometry";

export type PinchState = "OPEN" | "PINCHED" | "LOST";

export interface PinchInput {
  ratio: number | null;
  now: number;
  available: boolean;
}

export interface PinchOutput {
  state: PinchState;
  isPinched: boolean;
  justPinched: boolean;
  justReleased: boolean;
  requiresRearm: boolean;
}

export class PinchStateMachine {
  private state: PinchState = "OPEN";
  private lastSeen: number | null = null;
  private requiresRearm = false;
  private pinchCandidateAt: number | null = null;
  private releaseCandidateAt: number | null = null;

  get isLost(): boolean {
    return this.state === "LOST";
  }

  get wasRearmRequested(): boolean {
    return this.requiresRearm;
  }

  setRearmRequired(): void {
    this.requiresRearm = true;
  }

  clearRearmRequired(): void {
    this.requiresRearm = false;
  }

  update(input: PinchInput): PinchOutput {
    let justPinched = false;
    let justReleased = false;

    const now = input.now;
    if (!input.available || input.ratio === null || Number.isNaN(input.ratio)) {
      if (this.lastSeen === null || now - this.lastSeen > APP_CONFIG.handLostTimeoutMs) {
        if (this.state !== "LOST") {
          this.state = "LOST";
        }
      }
      this.pinchCandidateAt = null;
      this.releaseCandidateAt = null;
      return {
        state: this.state,
        isPinched: false,
        justPinched: false,
        justReleased: false,
        requiresRearm: this.requiresRearm,
      };
    }

    this.lastSeen = now;
    const ratio = clamp(input.ratio, 0, 1);

    const closeThreshold = APP_CONFIG.pinchCloseThreshold;
    const releaseThreshold = APP_CONFIG.pinchReleaseThreshold;

    switch (this.state) {
      case "LOST":
        this.state = "OPEN";
        this.requiresRearm = false;
        this.pinchCandidateAt = null;
        this.releaseCandidateAt = null;
        break;
      case "OPEN":
        if (ratio <= closeThreshold) {
          if (this.pinchCandidateAt === null) {
            this.pinchCandidateAt = now;
          } else if (now - this.pinchCandidateAt >= APP_CONFIG.pinchCloseDurationMs) {
            this.state = "PINCHED";
            justPinched = true;
            this.pinchCandidateAt = null;
            this.requiresRearm = false;
            this.releaseCandidateAt = null;
          }
        } else {
          this.pinchCandidateAt = null;
        }
        break;
      case "PINCHED":
        if (ratio >= releaseThreshold) {
          if (this.releaseCandidateAt === null) {
            this.releaseCandidateAt = now;
          } else if (now - this.releaseCandidateAt >= APP_CONFIG.pinchReleaseDurationMs) {
            this.state = "OPEN";
            this.requiresRearm = false;
            justReleased = true;
            this.releaseCandidateAt = null;
            this.pinchCandidateAt = null;
          }
        } else {
          this.releaseCandidateAt = null;
        }
        break;
      default:
        this.state = "OPEN";
        this.pinchCandidateAt = null;
        this.releaseCandidateAt = null;
        break;
    }

    const isPinched = this.state === "PINCHED";
    return {
      state: this.state,
      isPinched,
      justPinched,
      justReleased,
      requiresRearm: this.requiresRearm,
    };
  }
}
