import { describe, expect, it } from "vitest";
import { MouthStateMachine } from "@/interaction/MouthStateMachine";

describe("mouth state machine", () => {
  it("does not open instantly", () => {
    const machine = new MouthStateMachine();
    expect(machine.update({ mouthScore: 0.6, now: 0, visible: true }).state).toBe("OPEN");
    const mid = machine.update({ mouthScore: 0.3, now: 60, visible: true }).state;
    expect(mid).toBe("CLOSED");
  });
  it("needs stability to open", () => {
    const machine = new MouthStateMachine();
    machine.update({ mouthScore: 0.34, now: 0, visible: true });
    expect(machine.update({ mouthScore: 0.35, now: 120, visible: true }).state).toBe("CLOSED");
    expect(machine.update({ mouthScore: 0.39, now: 240, visible: true }).isOpen).toBe(true);
  });
  it("resets with face loss", () => {
    const machine = new MouthStateMachine();
    expect(machine.update({ mouthScore: 0.2, now: 0, visible: false }).state).toBe("LOST");
  });
});
