import { APP_CONFIG } from "@/config";
import { IconState, type DesktopIcon } from "@/domain/types";
import type { Point } from "@/utils/geometry";
import { clamp, clamp01 } from "@/utils/geometry";

export const drawIcon = (p: p5, icon: DesktopIcon, hover: boolean, dt: number): void => {
  const scaleFactor =
    icon.state === IconState.HELD
      ? 1.08 * (icon.animationProgress > 0 ? (1 - 0.2 * dt) : 1)
      : icon.state === IconState.HOVERED
        ? 1.06
        : 1;
  const finalSize = Math.max(APP_CONFIG.iconMinSize, Math.min(APP_CONFIG.iconMaxSize, icon.size * scaleFactor));
  const x = icon.position.x * p.width;
  const y = icon.position.y * p.height;
  const rotation = icon.state === IconState.HELD ? Math.sin(performance.now() / 120) * 0.06 : 0;
  const labelY = y + finalSize * 0.62 + 18;
  const glow = clamp(finalSize / APP_CONFIG.iconMaxSize, 0.75, 1.2);

  p.push();
  p.translate(x, y);
  p.rotate(rotation);
  if (icon.state === IconState.HOVERED || icon.state === IconState.HELD) {
    p.stroke(`rgba(120,255,255,0.6)`);
    p.strokeWeight(2);
    p.shadowBlur = 0;
    p.drawingContext.shadowColor = "rgba(80,255,255,0.8)";
    p.drawingContext.shadowBlur = 18;
  }
  p.fill(`hsl(${icon.visualSeed}, 75%, 46%)`);
  p.noStroke();
  p.rectMode(p.CENTER);
  p.rect(0, 0, finalSize * 0.9, finalSize * 0.82, 14);
  p.fill("#f7f7f7");
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14 * glow);
  p.text(icon.label, 0, finalSize * 0.45);
  p.fill("#ffffff");
  const iconScale = finalSize * 0.18;
  p.ellipse(0, 0, iconScale, iconScale * 0.8);
  p.pop();

  if (icon.state === IconState.EATEN) {
    const alpha = 0.2 + 0.6 * Math.random();
    p.fill(`rgba(255,255,255,${alpha})`);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.text("eaten", x, y - finalSize * 0.35);
  }
};
