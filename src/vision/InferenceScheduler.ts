export interface FrameCallback {
  onFrame: (timestampMs: number) => void;
}

export interface InferenceSchedulerOptions {
  minIntervalMs: number;
  running: boolean;
}

type VideoFrameRequester = {
  requestVideoFrameCallback: (
    callback: (time: DOMHighResTimeStamp, metadata: VideoFrameRequestMetadata) => void,
  ) => number;
  cancelVideoFrameCallback: (handle: number) => void;
};

type VideoFrameRequestMetadata = {
  expectedDisplayTime?: DOMHighResTimeStamp;
  mediaTime?: number;
};

export class InferenceScheduler {
  private rafId: number | null = null;
  private vfrcHandle: number | null = null;
  private running = false;
  private lastVideoTime = -1;
  private lastFired = -1;
  private requestTarget: HTMLVideoElement | null = null;

  constructor(
    private readonly callback: FrameCallback["onFrame"],
    private readonly options: InferenceSchedulerOptions,
  ) {}

  start(video: HTMLVideoElement): void {
    if (this.running) {
      return;
    }
    this.requestTarget = video;
    this.running = true;

    const tick = (timestamp: number): void => {
      if (!this.running) {
        return;
      }
      const mediaTime = Math.floor((video.currentTime || 0) * 1000);
      if (Number.isFinite(mediaTime) && mediaTime !== this.lastVideoTime) {
        this.lastVideoTime = mediaTime;
        const now = timestamp;
        if (this.lastFired < 0 || now - this.lastFired >= this.options.minIntervalMs) {
          this.lastFired = now;
          this.callback(now);
        }
      }
      this.rafId = requestAnimationFrame(tick);
    };

    const loopWithVideoFrame = (): void => {
      const requester = video as unknown as VideoFrameRequester;
      const onFrame = (_time: DOMHighResTimeStamp, metadata: VideoFrameRequestMetadata): void => {
        if (!this.running) {
          return;
        }
        const mediaTime = metadata.mediaTime ?? video.currentTime ?? 0;
        const rounded = Math.floor(mediaTime * 1000);
        if (Number.isFinite(rounded) && rounded !== this.lastVideoTime) {
          this.lastVideoTime = rounded;
          const now = performance.now();
          if (this.lastFired < 0 || now - this.lastFired >= this.options.minIntervalMs) {
            this.lastFired = now;
            this.callback(now);
          }
        }
        this.vfrcHandle = requester.requestVideoFrameCallback(onFrame);
      };
      this.vfrcHandle = requester.requestVideoFrameCallback(onFrame);
    };

    if ("requestVideoFrameCallback" in video) {
      loopWithVideoFrame();
      return;
    }
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.vfrcHandle !== null) {
      const requester = this.requestTarget as unknown as VideoFrameRequester | null;
      requester?.cancelVideoFrameCallback(this.vfrcHandle);
      this.vfrcHandle = null;
    }
    this.requestTarget = null;
  }
}
