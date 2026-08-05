import { APP_CONFIG } from "@/config";
import { IconState, type DesktopIcon } from "@/domain/types";
import { clampPointInside, lerpPoint, Point } from "@/utils/geometry";

export interface DragInput {
  now: number;
  dt: number;
  icons: DesktopIcon[];
  pinchPosition: Point;
  pinchState: "OPEN" | "CLOSING" | "PINCHED" | "OPENING" | "LOST";
  canGrab: boolean;
  inputActive?: boolean;
  handId: number | null;
  handLost: boolean;
}

export interface DragOutput {
  heldIconId: string | null;
  shouldRelease: boolean;
  requireRearm: boolean;
  movedAny: boolean;
}

export interface HeldEntry {
  handId: number;
  iconId: string;
  grabOffset: Point;
}

export class DragController {
  private held: HeldEntry | null = null;
  private requiresRearm = false;
  private lastGrabReleasedAt: number | null = null;

  get heldIconId(): string | null {
    return this.held?.iconId ?? null;
  }

  get isHolding(): boolean {
    return this.held !== null;
  }

  get releaseRequested(): boolean {
    return this.requiresRearm;
  }

  update(input: DragInput): DragOutput {
    let movedAny = false;
    let shouldRelease = false;
    const shouldHold = input.inputActive === true;

    if (this.held) {
      if (input.handLost || (input.pinchState === "OPEN" && !shouldHold)) {
        shouldRelease = true;
      } else {
        const icon = input.icons.find((current) => current.id === this.held?.iconId);
        if (!icon || icon.state === IconState.EATEN) {
          shouldRelease = true;
        } else {
          const target = {
            x: input.pinchPosition.x - this.held.grabOffset.x,
            y: input.pinchPosition.y - this.held.grabOffset.y,
          };
          this.moveHeldIcon(icon, target, input.dt);
          movedAny = true;
        }
      }
    } else if (input.canGrab && input.pinchState === "PINCHED" && !this.requiresRearm) {
      const candidate = this.findCandidate(input.icons, input.pinchPosition);
      if (candidate) {
        const icon = candidate.icon;
        const offset = {
          x: input.pinchPosition.x - icon.position.x,
          y: input.pinchPosition.y - icon.position.y,
        };
        icon.grabOffset = offset;
        icon.state = IconState.HELD;
        icon.animationProgress = 1;
        icon.zIndex = this.maxZ(input.icons) + 1;
        if (input.handId !== null) {
          this.held = { handId: input.handId, iconId: icon.id, grabOffset: offset };
        }
      }
    }

    if (shouldRelease) {
      const heldIconId = this.held?.iconId ?? null;
      const icon = input.icons.find((current) => current.id === heldIconId);
      if (icon && icon.state === IconState.HELD) {
        icon.state = IconState.IDLE;
      }
      this.held = null;
      this.lastGrabReleasedAt = input.now;
      this.requiresRearm = true;
    }
    if (!this.isHolding && this.requiresRearm && input.pinchState === "OPEN" && !shouldHold) {
      this.requiresRearm = false;
    }

    return {
      heldIconId: this.heldIconId,
      shouldRelease,
      requireRearm: this.requiresRearm,
      movedAny,
    };
  }

  private clampToViewport(point: Point): Point {
    const width = typeof window === "undefined" ? Number.MAX_SAFE_INTEGER : window.innerWidth;
    const height = typeof window === "undefined" ? Number.MAX_SAFE_INTEGER : window.innerHeight;
    return clampPointInside(point, width, height);
  }

  private moveHeldIcon(icon: DesktopIcon, target: Point, dt: number): void {
    const clamped = this.clampToViewport(target);
    const alpha = 1 - Math.exp(-18 * Math.max(0, dt));
    const next = lerpPoint(icon.position, clamped, alpha);
    icon.position = next;
    icon.state = IconState.HELD;
    icon.animationProgress = 1;
  }

  private maxZ(icons: DesktopIcon[]): number {
    return icons.reduce((acc, icon) => Math.max(acc, icon.zIndex), 0);
  }

  private findCandidate(icons: DesktopIcon[], pinchPoint: Point): { icon: DesktopIcon; distance: number } | null {
    const candidates = icons
      .filter((icon) => icon.state !== IconState.EATEN && icon.state !== IconState.CONSUMING)
      .map((icon) => {
        const radius = icon.size / 2 + APP_CONFIG.iconHitPadding;
        const dx = icon.position.x - pinchPoint.x;
        const dy = icon.position.y - pinchPoint.y;
        return { icon, distance: dx * dx + dy * dy, inside: Math.abs(dx) <= radius && Math.abs(dy) <= radius };
      })
      .filter((entry) => entry.inside);
    if (candidates.length === 0) {
      return null;
    }
    candidates.sort((a, b) => {
      if (a.icon.zIndex !== b.icon.zIndex) {
        return b.icon.zIndex - a.icon.zIndex;
      }
      return a.distance - b.distance;
    });
    return candidates[0];
  }
}
