import p5 from "p5";
import { APP_CONFIG } from "@/config";
import { getReducedMotionScale } from "@/config";
import { CameraRenderer } from "@/rendering/CameraRenderer";
import { drawDesktop } from "@/rendering/DesktopRenderer";
import { drawMouthHint, drawPinchHint } from "@/rendering/GestureRenderer";
import { drawDebug } from "@/rendering/DebugRenderer";
import { ParticleSystem } from "@/rendering/ParticleSystem";
import { OverlayUI } from "@/ui/OverlayUI";
import { AccessibilityAnnouncer } from "@/ui/AccessibilityAnnouncer";
import type { App } from "@/app/App";

export const createSketch = (app: App, video: HTMLVideoElement, controlsRoot: HTMLElement): p5 => {
  const cameraRenderer = new CameraRenderer();
  const particles = new ParticleSystem(APP_CONFIG.particleCountLimit);
  const overlay = new OverlayUI(
    controlsRoot,
    document.body,
    () => void app.startCameraMode(),
    () => void app.reset(),
    () => app.startPointerMode(),
  );
  const announcer = new AccessibilityAnnouncer(document.body);
  const sketch = (p: p5) => {
    const draw = (): void => {
      const dt = p.deltaTime / 1000;
      const state = app.currentState;
      app.step(performance.now());
      const dpr = Math.min(APP_CONFIG.maxDpr, window.devicePixelRatio || 1);
      p.pixelDensity(dpr);
      p.background(8, 12, 18);
      cameraRenderer.drawBackground(p, video, p.width, p.height);

      if (state.mode === "pointer" || state.mode === "camera") {
        drawDesktop(p, state, dt);
        drawPinchHint(p, 0, { x: 0, y: 0 }, { x: 0, y: 0 }, "OPEN");
        if (state.mouthVisible && state.mouthRadiusX > 0) {
          drawMouthHint(p, state.mouthCenter, state.mouthRadiusX, state.mouthRadiusY, true);
        }
      }

      particles.update(dt);
      particles.draw(p, getReducedMotionScale());
      if (APP_CONFIG.debugEnabled) {
        drawDebug(p, state);
      }

      overlay.render(state, app.overlayStatus);
      announcer.announce(state.errorMessage ?? "ゲーム開始");
    };

    p.setup = () => {
      p.createCanvas(window.innerWidth, window.innerHeight);
      p.frameRate(60);
      p.noStroke();
      p.textFont("Arial", 14);
      window.addEventListener("resize", () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
      });
    };
    p.draw = draw;
  };

  return new p5(sketch);
};
