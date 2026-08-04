import { APP_CONFIG } from "@/config";
import { clamp } from "@/utils/geometry";
import { hasExpired } from "@/utils/timing";

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
  private closeStart: number | null = null;
  private openStart: number | null = null;
  private lastSeen: number | null = null;
  private requiresRearm = false;

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
        break;
      case "OPEN":
        this.openStart = null;
        if (ratio <= closeThreshold) {
          this.closeStart = this.closeStart ?? now;
          if (hasExpired(this.closeStart, now, APP_CONFIG.pinchCloseDurationMs)) {
            this.state = "PINCHED";
            this.closeStart = null;
            this.openStart = null;
            justPinched = true;
            if (!this.requiresRearm) {
              this.requiresRearm = false;
            }
          }
        } else {
          this.closeStart = null;
        }
        break;
      case "PINCHED":
        if (this.requiresRearm) {
          if (ratio > releaseThreshold * 1.05) {
            this.state = "OPEN";
            this.openStart = null;
            justReleased = true;
          }
          break;
        }
        if (ratio >= releaseThreshold) {
          this.openStart = this.openStart ?? now;
          if (hasExpired(this.openStart, now, APP_CONFIG.pinchReleaseDurationMs)) {
            this.state = "OPEN";
            this.openStart = null;
            justReleased = true;
            this.closeStart = null;
          }
        } else {
          this.openStart = null;
        }
        break;
      default:
        this.state = "OPEN";
        break;
    }

    if (!this.requiresRearm && this.state === "OPEN") {
      this.openStart = null;
      this.closeStart = null;
    }
    if (this.requiresRearm && this.state === "OPEN") {
      this.closeStart = null;
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
