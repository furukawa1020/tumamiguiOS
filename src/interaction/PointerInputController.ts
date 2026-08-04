import type { Point } from "@/utils/geometry";

export interface PointerHandState {
  handId: number;
  position: Point;
  ratio: number;
  open: boolean;
}

export class PointerInputController {
  private isDown = false;
  private position: Point = { x: 0, y: 0 };
  private pointerHand: PointerHandState = {
    handId: 0,
    position: { x: 0, y: 0 },
    ratio: 1,
    open: true,
  };
  private listeners: Array<() => void> = [];

  constructor(private readonly element: HTMLElement, private readonly canvasSizeProvider: () => { width: number; height: number }) {
    this.bind();
  }

  private bind(): void {
    const onMove = (event: PointerEvent) => {
      const { width, height } = this.canvasSizeProvider();
      const rect = this.element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * width;
      const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * height;
      this.position = { x, y };
    };
    const onDown = (event: PointerEvent) => {
      this.isDown = true;
      onMove(event);
      this.pointerHand.open = false;
      this.notify();
    };
    const onUp = () => {
      this.isDown = false;
      this.pointerHand.open = true;
      this.notify();
    };
    const onLeave = () => {
      this.isDown = false;
      this.pointerHand.open = true;
      this.notify();
    };
    this.element.addEventListener("pointermove", onMove);
    this.element.addEventListener("pointerdown", onDown);
    this.element.addEventListener("pointerup", onUp);
    this.element.addEventListener("pointercancel", onLeave);
    this.element.addEventListener("pointerleave", onLeave);
    this.listeners.push(
      () => this.element.removeEventListener("pointermove", onMove),
      () => this.element.removeEventListener("pointerdown", onDown),
      () => this.element.removeEventListener("pointerup", onUp),
      () => this.element.removeEventListener("pointercancel", onLeave),
      () => this.element.removeEventListener("pointerleave", onLeave),
    );
  }

  get hand(): PointerHandState {
    this.pointerHand.position = this.position;
    this.pointerHand.ratio = this.isDown ? 0.1 : 1;
    return this.pointerHand;
  }

  dispose(): void {
    this.listeners.forEach((remove) => remove());
    this.listeners = [];
  }

  private notify(): void {
    this.hand;
  }
}
