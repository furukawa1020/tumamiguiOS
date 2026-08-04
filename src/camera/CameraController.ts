import { CameraPermissionError, CameraUnavailableError } from "@/camera/cameraErrors";
import type { APP_CONFIG } from "@/config";
import type { Point } from "@/utils/geometry";

export interface CameraDimensions {
  width: number;
  height: number;
}

export class CameraController {
  private stream: MediaStream | null = null;
  private _dimensions: CameraDimensions = { width: 0, height: 0 };
  private stopped = false;

  constructor(private readonly video: HTMLVideoElement) {}

  get streamTrack(): MediaStream | null {
    return this.stream;
  }

  get dimensions(): CameraDimensions {
    return this._dimensions;
  }

  async start(): Promise<CameraDimensions> {
    this.stopped = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new CameraUnavailableError("mediaDevicesが利用できません。");
    }
    const primary = APP_CONFIG.cameraConstraints;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(primary);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw new CameraUnavailableError();
      }
      if (error.name === "NotAllowedError") {
        throw new CameraPermissionError();
      }
      if (error.name === "OverconstrainedError") {
        const fallback: MediaTrackConstraints = {
          video: {
            audio: false,
            width: true,
            height: true,
          },
          audio: false,
        };
        this.stream = await navigator.mediaDevices.getUserMedia(fallback);
      } else {
        throw error;
      }
    }

    const media = this.stream;
    if (!media) {
      throw new CameraUnavailableError();
    }

    this.video.srcObject = media;
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.autoplay = true;
    await this.video.play().catch(() => undefined);

    await new Promise<void>((resolve, reject) => {
      this.video.onloadedmetadata = () => resolve();
      const timeout = setTimeout(() => {
        reject(new CameraUnavailableError("カメラ初期化がタイムアウトしました。"));
      }, 8000);
      this.video.addEventListener(
        "error",
        () => {
          clearTimeout(timeout);
          reject(new CameraUnavailableError());
        },
        { once: true },
      );
    });

    this._dimensions = {
      width: this.video.videoWidth || APP_CONFIG.cameraConstraints.video?.width?.ideal || 1280,
      height: this.video.videoHeight || APP_CONFIG.cameraConstraints.video?.height?.ideal || 720,
    };

    return this._dimensions;
  }

  stop(): void {
    if (!this.stream) {
      this.video.srcObject = null;
      return;
    }
    this.stopped = true;
    this.stream.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
  }

  async pause(): Promise<void> {
    this.stopped = true;
    this.video.pause();
  }

  async resume(): Promise<void> {
    if (!this.stream || this.stopped) {
      return;
    }
    await this.video.play().catch(() => undefined);
  }

  get active(): boolean {
    return this.stream !== null;
  }
}
