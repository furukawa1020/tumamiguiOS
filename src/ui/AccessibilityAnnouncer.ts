export class AccessibilityAnnouncer {
  private liveRegion: HTMLElement;

  constructor(private readonly container: HTMLElement) {
    this.liveRegion = document.createElement("div");
    this.liveRegion.setAttribute("aria-live", "polite");
    this.liveRegion.className = "sr-only";
    this.container.appendChild(this.liveRegion);
  }

  announce(text: string): void {
    this.liveRegion.textContent = text;
  }
}
