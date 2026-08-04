import type { Point } from "@/utils/geometry";
import { clamp01 } from "@/utils/geometry";

export interface VectorSmoothingConfig {
  alphaMin: number;
  alphaMax: number;
  velocityGain: number;
}

const DEFAULT_VECTOR_CONFIG: VectorSmoothingConfig = {
  alphaMin: 0.18,
  alphaMax: 0.7,
  velocityGain: 12,
};

const DEFAULT_SCALAR_CONFIG: VectorSmoothingConfig = {
  alphaMin: 0.2,
  alphaMax: 0.9,
  velocityGain: 10,
};

export class VectorSmoother {
  private state: Point | null = null;

  constructor(private config: VectorSmoothingConfig = DEFAULT_VECTOR_CONFIG) {}

  reset(): void {
    this.state = null;
  }

  update(next: Point, deltaSeconds: number): Point {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      this.state = next;
      return next;
    }

    if (!this.state) {
      this.state = next;
      return next;
    }

    const speed = Math.hypot(next.x - this.state.x, next.y - this.state.y) / Math.max(
      0.001,
      deltaSeconds,
    );
    const normalizedSpeed = clamp01(speed / 1500);
    const alpha = this.config.alphaMin + (this.config.alphaMax - this.config.alphaMin) * Math.min(1, normalizedSpeed * this.config.velocityGain);

    this.state = {
      x: this.state.x + (next.x - this.state.x) * alpha,
      y: this.state.y + (next.y - this.state.y) * alpha,
    };
    return this.state;
  }
}

export class ScalarSmoother {
  private state: number | null = null;

  constructor(private config: VectorSmoothingConfig = DEFAULT_SCALAR_CONFIG) {}

  reset(): void {
    this.state = null;
  }

  update(next: number, deltaSeconds: number): number {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      this.state = next;
      return next;
    }

    if (this.state === null) {
      this.state = next;
      return next;
    }

    const speed = Math.abs(next - this.state) / Math.max(0.001, deltaSeconds);
    const normalizedSpeed = clamp01(speed / 8);
    const alpha = this.config.alphaMin + (this.config.alphaMax - this.config.alphaMin) * Math.min(1, normalizedSpeed * this.config.velocityGain);
    this.state = this.state + (next - this.state) * alpha;
    return this.state;
  }
}
