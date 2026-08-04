import { IconState } from "@/domain/types";
import { drawIcon } from "@/rendering/IconRenderer";
import type { AppState } from "@/app/AppState";

export const drawDesktop = (
  p: p5,
  appState: AppState,
  progress: number,
): void => {
  const baseSize = Math.min(p.width, p.height);
  appState.icons.forEach((icon) => {
    if (icon.state === IconState.EATEN) {
      const alpha = 0.25 * (1 - icon.animationProgress);
      p.tint(255, 255 * Math.max(0.2, alpha));
      drawIcon(p, icon, false, progress);
      p.noTint();
      return;
    }
    drawIcon(p, icon, icon.state === IconState.HOVERED, progress);
  });
};
