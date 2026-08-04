import "./styles.css";
import { APP_NAME } from "@/config";
import { App } from "@/app/App";
import { createSketch } from "@/rendering/createSketch";

const appRoot = document.querySelector<HTMLDivElement>("#app");
const controls = document.querySelector<HTMLElement>("#controls");
const video = document.querySelector<HTMLVideoElement>("#camera");

if (!appRoot || !controls || !video) {
  throw new Error("必要な要素がありません。");
}

appRoot.setAttribute("tabindex", "-1");
appRoot.setAttribute("role", "application");
appRoot.setAttribute("aria-label", APP_NAME);

const app = new App(
  { video, canvasElement: controls },
  new URLSearchParams(window.location.search),
  (state) => {
    if (state.errorMessage) {
      const button = controls.querySelector("#start-camera") as HTMLButtonElement | null;
      if (button) {
        button.focus();
      }
    }
  },
);

createSketch(app, video, controls);

// Avoid default pull-to-refresh on supported mobile browsers.
document.addEventListener("touchmove", (event) => {
  const target = event.target as HTMLElement;
  if (target.closest("#controls")) {
    return;
  }
  event.preventDefault();
}, { passive: false });
