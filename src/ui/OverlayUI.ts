import { APP_NAME, APP_TAGLINE } from "@/config";
import { APP_TAGLINE as _tagline } from "@/config";
import type { AppState } from "@/app/AppState";

export class OverlayUI {
  private startButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private titleEl: HTMLElement;
  private subtitleEl: HTMLElement;
  private statusEl: HTMLElement;
  private errorEl: HTMLElement;
  private canvasAnnounceEl: HTMLElement;
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
        <button id="start-camera" type="button" aria-label="カメラで遊ぶ">カメラで遊ぶ</button>
        <button id="start-pointer" type="button" aria-label="ポインターデモを開始">pointerデモで遊ぶ</button>
        <button id="restart" type="button" aria-label="もう一皿">もう一皿</button>
        <div id="app-status" role="status" aria-live="polite"></div>
        <div id="app-error" role="alert" aria-live="assertive"></div>
        <div id="mode-hint">ページ上のボタンまたはEnterキーで開始できます。</div>
      </div>
    `;
    this.startButton = this.root.querySelector("#start-camera") as HTMLButtonElement;
    this.resetButton = this.root.querySelector("#restart") as HTMLButtonElement;
    this.titleEl = this.root.querySelector("h1") as HTMLElement;
    this.subtitleEl = this.root.querySelector("p") as HTMLElement;
    this.statusEl = this.root.querySelector("#app-status") as HTMLElement;
    this.errorEl = this.root.querySelector("#app-error") as HTMLElement;
    this.startModeHint = this.root.querySelector("#mode-hint") as HTMLElement;
    this.canvasAnnounceEl = this.root.querySelector(".overlay") as HTMLElement;

    const pointerButton = this.root.querySelector("#start-pointer") as HTMLButtonElement;
    pointerButton.addEventListener("click", () => onKeyRetry());
    this.startButton.addEventListener("click", () => onStartCamera());
    this.resetButton.addEventListener("click", () => onReset());
    this.app?.addEventListener("keydown", this.onKeyDown);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      this.onStartCamera();
    } else if (event.key.toLowerCase() === "r") {
      this.onReset();
    }
  };

  render(state: AppState, statusText: string): void {
    if (!state.errorMessage) {
      this.errorEl.textContent = "";
    } else {
      this.errorEl.textContent = state.errorMessage;
    }
    this.statusEl.textContent = state.completed ? "すべてのアイコンを食べました。もう一皿ボタンで再開できます。" : statusText;
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
