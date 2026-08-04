export class SoundController {
  private audioContext: AudioContext | null = null;
  private started = false;

  async init(): Promise<void> {
    if (this.started) {
      return;
    }
    this.audioContext = new AudioContext();
    this.started = true;
  }

  private ensureContext(): AudioContext | null {
    return this.audioContext;
  }

  async playPick(): Promise<void> {
    const context = this.ensureContext();
    if (!context) {
      return;
    }
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    gain.gain.value = 0.03;
    osc.connect(gain).connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.05);
  }
}
