import { AppState } from "@/app/AppState";

export const drawDebug = (p: p5, state: AppState): void => {
  p.push();
  p.noStroke();
  p.fill("rgba(0, 0, 0, 0.45)");
  p.rect(12, 12, 270, 116, 8);
  p.fill(240);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const lines = [
    `mode: ${state.mode}`,
    `held: ${state.heldIconId ?? "none"}`,
    `mouth: (${Math.round(state.mouthCenter.x)}, ${Math.round(state.mouthCenter.y)})`,
    `mouth size: ${Math.round(state.mouthRadiusX)}x${Math.round(state.mouthRadiusY)}`,
    `error: ${state.errorMessage ?? "none"}`,
  ];
  lines.forEach((line, index) => p.text(line, 20, 24 + index * 16));
  p.pop();
};
