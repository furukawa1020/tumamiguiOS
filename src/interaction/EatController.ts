import { APP_CONFIG } from "@/config";
import { IconState, type DesktopIcon } from "@/domain/types";
import { pointInEllipse } from "@/utils/geometry";

export interface EatInput {
  mouthCenter: { x: number; y: number };
  mouthRadiusX: number;
  mouthRadiusY: number;
  mouthOpen: boolean;
  faceDetected: boolean;
  heldIconId: string | null;
  icons: DesktopIcon[];
  now: number;
}

export interface EatOutput {
  consumedId: string | null;
  allConsumed: boolean;
  eatProgress: number;
}

export class EatController {
  private dwellStart = new Map<string, number>();
  private consumed = new Set<string>();

  private startedId: string | null = null;
  private consumeStart = 0;

  update(input: EatInput): EatOutput {
    let consumedId: string | null = null;
    let allConsumed = false;
    const heldIcon = input.icons.find((icon) => icon.id === input.heldIconId);

    if (!heldIcon || !input.faceDetected || !input.mouthOpen || input.heldIconId === null) {
      this.dwellStart.clear();
      return { consumedId: null, allConsumed: false, eatProgress: 0 };
    }

    if (!pointInEllipse(heldIcon.position, input.mouthCenter, input.mouthRadiusX, input.mouthRadiusY)) {
      this.dwellStart.set(input.heldIconId, input.now);
      return { consumedId: null, allConsumed: false, eatProgress: 0 };
    }

    const existing = this.dwellStart.get(input.heldIconId) ?? null;
    if (existing === null) {
      this.dwellStart.set(input.heldIconId, input.now);
    } else if (input.now - existing >= APP_CONFIG.eatDwellDurationMs) {
      if (!this.consumed.has(input.heldIconId) && heldIcon.state !== IconState.CONSUMING && heldIcon.state !== IconState.EATEN) {
        heldIcon.state = IconState.CONSUMING;
        heldIcon.animationProgress = 0;
        this.consumeStart = input.now;
        this.startedId = input.heldIconId;
        this.consumed.add(input.heldIconId);
        consumedId = input.heldIconId;
      }
    }

    const progress =
      this.startedId && heldIcon?.state === IconState.CONSUMING
        ? Math.min(1, (input.now - this.consumeStart) / APP_CONFIG.consumeDurationMs)
        : 0;

    if (this.startedId && heldIcon?.state === IconState.CONSUMING && progress >= 1) {
      heldIcon.state = IconState.EATEN;
      heldIcon.animationProgress = 1;
      this.startedId = null;
      this.dwellStart.delete(input.heldIconId);
      allConsumed = input.icons.filter((icon) => icon.state !== IconState.EATEN).length === 0;
    }

    if (this.startedId && heldIcon?.state !== IconState.CONSUMING) {
      this.startedId = null;
    }
    return {
      consumedId,
      allConsumed,
      eatProgress: progress,
    };
  }
}
