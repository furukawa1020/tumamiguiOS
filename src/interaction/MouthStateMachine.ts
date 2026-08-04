import { APP_CONFIG } from "@/config";
import { clamp01 } from "@/utils/geometry";
import { hasExpired } from "@/utils/timing";

export type MouthState = "CLOSED" | "OPENING" | "OPEN" | "CLOSING" | "LOST";

export interface MouthInput {
  mouthScore: number;
  now: number;
  visible: boolean;
}

export interface MouthOutput {
  state: MouthState;
  isOpen: boolean;
  score: number;
}

export class MouthStateMachine {
  private state: MouthState = "LOST";
  private openStart: number | null = null;
  private lastSeen: number | null = null;
  private lastScore = 0;

  update(input: MouthInput): MouthOutput {
    const now = input.now;
    if (!input.visible || !Number.isFinite(input.mouthScore)) {
      if (this.lastSeen === null || now - this.lastSeen > 250) {
        this.state = "LOST";
      }
      return {
        state: this.state,
        isOpen: false,
        score: this.lastScore,
      };
    }

    this.lastSeen = now;
    const score = clamp01(input.mouthScore);
    this.lastScore = score;

    if (this.state === "LOST") {
      this.state = "CLOSED";
      this.openStart = null;
    }
    const instantOpenThreshold = 0.6;
    const stableOpenThreshold = APP_CONFIG.mouthOpenEnterThreshold + 0.07;
    const closeThreshold = 0.3;

    switch (this.state) {
      case "CLOSED":
      if (score >= instantOpenThreshold) {
        this.state = "OPEN";
        this.openStart = null;
      } else if (score >= stableOpenThreshold) {
        this.openStart = this.openStart ?? now;
        if (hasExpired(this.openStart, now, APP_CONFIG.mouthOpenDurationMs)) {
          this.state = "OPEN";
          this.openStart = null;
        }
        } else {
          this.openStart = null;
        }
        break;
      case "OPEN":
        if (score <= closeThreshold) {
          this.state = "CLOSED";
          this.openStart = null;
        }
        break;
      case "OPENING":
      case "CLOSING":
        if (score >= instantOpenThreshold) {
          this.state = "OPEN";
          this.openStart = null;
        } else if (score <= closeThreshold) {
          this.state = "CLOSED";
          this.openStart = null;
        }
        break;
      default:
        break;
    }

    return {
      state: this.state,
      isOpen: this.state === "OPEN" || this.state === "OPENING",
      score,
    };
  }
}
