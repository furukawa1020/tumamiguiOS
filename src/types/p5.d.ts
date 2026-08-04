interface P5Instance {
  [key: string]: (...args: unknown[]) => unknown;
  createCanvas: (width: number, height: number) => void;
  frameRate: (fps?: number) => void;
  noStroke: () => void;
  textFont: (font: string, size?: number) => void;
  background: (...args: unknown[]) => void;
  resizeCanvas: (width: number, height: number) => void;
  deltaTime: number;
  width: number;
  height: number;
  pixelDensity: (value: number) => void;
  image: (...args: unknown[]) => void;
  imageMode: (mode: number) => void;
  translate: (x: number, y: number) => void;
  scale: (x: number, y?: number) => void;
  pop: () => void;
  push: () => void;
  stroke: (...args: unknown[]) => void;
  strokeWeight: (weight: number) => void;
  rect: (x: number, y: number, w: number, h: number, radius?: number) => void;
  rectMode: (mode: number) => void;
  fill: (...args: unknown[]) => void;
  textAlign: (xAlign: number, yAlign: number) => void;
  textSize: (size: number) => void;
  text: (content: string, x: number, y: number) => void;
  noFill: () => void;
  tint: (...args: unknown[]) => void;
  noTint: () => void;
  textFontStyle?: string;
  drawingContext: CanvasRenderingContext2D;
  noLoop?: () => void;
  noStroke?: () => void;
  arc: (x: number, y: number, w: number, h: number, start: number, stop: number) => void;
  ellipse: (x: number, y: number, w: number, h: number) => void;
  shadowBlur?: number;
  LEFT: number;
  TOP: number;
  CENTER: number;
  CORNER: number;
  BOTTOM: number;
}

type P5Constructor = new (sketch: (p: P5Instance) => void) => P5Instance;

declare module "p5" {
  const p5: P5Constructor;
  export default p5;
}

declare global {
  const p5: P5Constructor;
  type p5 = P5Instance;
}

export {};
