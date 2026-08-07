import { APP_NAME, APP_TAGLINE } from "@/config";
import type { AppState } from "@/app/AppState";

export class OverlayUI {
  private startButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private statusEl: HTMLElement;
  private errorEl: HTMLElement;
  private startModeHint: HTMLElement;

  constructor(
    private readonly root: HTMLElement,
    private readonly app: HTMLElement | null,
    private readonly onStartCamera: () => void,
    private readonly onReset: () => void,
    private readonly onKeyRetry: () => void,
  ) {
    this.root.innerHTML = `
      <div class="overlay panel">
        <h1>${APP_NAME}</h1>
        <p>${APP_TAGLINE}</p>
        <button id="start-camera" type="button" aria-label="Start camera">Start camera</button>
        <button id="start-pointer" type="button" aria-label="Start pointer mode">Start pointer mode</button>
        <button id="restart" type="button" aria-label="Reset">Reset</button>
        <p class="overlay-note">
          Start with pointer mode to test dragging quickly, then try camera mode.
          Keep an icon near your mouth while it is open to consume it.
        </p>
        <div id="app-status" role="status" aria-live="polite"></div>
        <div id="app-error" role="alert" aria-live="assertive"></div>
        <div id="mode-hint">
          Pinch guide: keep only thumb and index tip together in front of camera, then move over icon.
        </div>
      </div>
    `;
    this.startButton = this.root.querySelector("#start-camera") as HTMLButtonElement;
    const pointerButton = this.root.querySelector("#start-pointer") as HTMLButtonElement;
    this.resetButton = this.root.querySelector("#restart") as HTMLButtonElement;
    this.statusEl = this.root.querySelector("#app-status") as HTMLElement;
    this.errorEl = this.root.querySelector("#app-error") as HTMLElement;
    this.startModeHint = this.root.querySelector("#mode-hint") as HTMLElement;
    this.startModeHint.textContent = "Pinch guide: thumb + index together, then drag over icon.";

    pointerButton.addEventListener("click", () => onKeyRetry());
    this.startButton.addEventListener("click", () => onStartCamera());
    this.resetButton.addEventListener("click", () => onReset());
    this.app?.addEventListener("keydown", this.onKeyDown);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      this.startButton.click();
    } else if (event.key.toLowerCase() === "r") {
      this.resetButton.click();
    }
  };

  render(state: AppState, statusText: string): void {
    this.errorEl.textContent = state.errorMessage ?? "";
    this.statusEl.textContent = state.completed
      ? "Completed. Press Restart to play again."
      : statusText;

    if (state.mode === "idle") {
      this.startButton.disabled = false;
    } else {
      this.startButton.disabled = true;
    }
    this.resetButton.disabled = false;

    if (state.errorMessage) {
      this.statusEl.textContent = state.errorMessage;
    }
  }
}
