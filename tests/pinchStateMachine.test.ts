import { describe, expect, it } from "vitest";
import { PinchStateMachine } from "@/interaction/PinchStateMachine";

describe("pinch state machine", () => {
  it("does not pinched on one frame noise", () => {
    const machine = new PinchStateMachine();
    expect(machine.update({ ratio: 0.6, now: 0, available: true }).state).toBe("OPEN");
    expect(machine.update({ ratio: 0.05, now: 30, available: true }).state).toBe("OPEN");
  });
  it("transitions to pinched with sustained ratio", () => {
    const machine = new PinchStateMachine();
    machine.update({ ratio: 0.6, now: 0, available: true });
    expect(machine.update({ ratio: 0.1, now: 100, available: true }).state).toBe("OPEN");
    const output = machine.update({ ratio: 0.1, now: 250, available: true });
    expect(output.isPinched).toBe(true);
  });
  it("requires re-open to unpinch with sustained exit", () => {
    const machine = new PinchStateMachine();
    machine.update({ ratio: 0.1, now: 0, available: true });
    machine.update({ ratio: 0.1, now: 120, available: true });
    machine.update({ ratio: 0.12, now: 240, available: true });
    expect(machine.update({ ratio: 0.55, now: 420, available: true }).state).toBe("OPEN");
  });
});
