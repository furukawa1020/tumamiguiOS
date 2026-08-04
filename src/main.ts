import "./styles.css";
import { APP_NAME } from "@/config";
import { App } from "@/app/App";
import { createSketch } from "@/rendering/createSketch";

const appRoot = document.querySelector<HTMLDivElement>("#app");
const controls = document.querySelector<HTMLElement>("#controls");
const video = document.querySelector<HTMLVideoElement>("#camera");

if (!appRoot || !controls || !video) {
  throw new Error("App root, controls, or camera element is missing.");
}

appRoot.setAttribute("tabindex", "-1");
appRoot.setAttribute("role", "application");
appRoot.setAttribute("aria-label", APP_NAME);

const app = new App(
  { video, canvasElement: controls },
  new URLSearchParams(window.location.search),
  () => {},
);

createSketch(app, video, controls);

document.addEventListener("touchmove", (event) => {
  const target = event.target as HTMLElement;
  if (target.closest("#controls")) {
    return;
  }
  event.preventDefault();
}, { passive: false });

