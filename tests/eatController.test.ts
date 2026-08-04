import { describe, expect, it } from "vitest";
import { EatController } from "@/interaction/EatController";
import { IconState, type DesktopIcon } from "@/domain/types";

const icon: DesktopIcon = {
  id: "a",
  label: "A",
  type: "icon",
  position: { x: 100, y: 100 },
  initialPosition: { x: 100, y: 100 },
  size: 76,
  state: IconState.HELD,
  zIndex: 1,
  grabOffset: { x: 0, y: 0 },
  animationProgress: 0,
  visualSeed: 0,
};

describe("eat controller", () => {
  it("does not consume if closed", () => {
    const controller = new EatController();
    const out = controller.update({
      mouthCenter: { x: 100, y: 100 },
      mouthRadiusX: 80,
      mouthRadiusY: 50,
      mouthOpen: false,
      faceDetected: true,
      heldIconId: "a",
      icons: [icon],
      now: 100,
    });
    expect(out.consumedId).toBeNull();
  });
});
