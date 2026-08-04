import { describe, expect, it } from "vitest";
import { DragController } from "@/interaction/DragController";
import { IconState, type DesktopIcon } from "@/domain/types";

const createIcon = (override: Partial<DesktopIcon> = {}): DesktopIcon => ({
  id: "icon-1",
  label: "A",
  type: "test",
  position: { x: 100, y: 100 },
  initialPosition: { x: 100, y: 100 },
  size: 76,
  state: IconState.IDLE,
  zIndex: 1,
  grabOffset: { x: 0, y: 0 },
  animationProgress: 0,
  visualSeed: 10,
  ...override,
});

describe("drag controller", () => {
  it("starts grab only once at pinched", () => {
    const drag = new DragController();
    const icons = [createIcon()];
    const output = drag.update({
      now: 0,
      dt: 0.016,
      icons,
      pinchPosition: { x: 100, y: 100 },
      pinchState: "PINCHED",
      canGrab: true,
      handId: 0,
      handLost: false,
    });
    expect(output.heldIconId).toBe("icon-1");
    const second = drag.update({
      now: 16,
      dt: 0.016,
      icons,
      pinchPosition: { x: 90, y: 90 },
      pinchState: "PINCHED",
      canGrab: true,
      handId: 0,
      handLost: false,
    });
    expect(second.heldIconId).toBe("icon-1");
  });
});
