import { normalizedToScreen } from "@/utils/geometry";

export class CameraRenderer {
  drawBackground(
    p: p5,
    video: HTMLVideoElement,
    width: number,
    height: number,
  ): void {
    p.push();
    p.background(18, 22, 28);
    if (
      !(video instanceof HTMLVideoElement) ||
      video.readyState < 2 ||
      !video.srcObject ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      p.pop();
      return;
    }
    const videoWidth = video.videoWidth || width;
    const videoHeight = video.videoHeight || height;
    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = width / height;
    let dw = width;
    let dh = height;
    if (videoAspect > canvasAspect) {
      dh = height;
      dw = height * videoAspect;
    } else {
      dw = width;
      dh = width / videoAspect;
    }
    const offsetX = (width - dw) / 2;
    const offsetY = (height - dh) / 2;
    p.imageMode(p.CORNER);
    p.push();
    p.translate(width, 0);
    p.scale(-1, 1);
    try {
      p.image(video, offsetX, offsetY, dw, dh);
    } catch {
      // If the video element becomes unavailable during draw, skip this frame.
    }
    p.pop();
    p.noFill();
    p.stroke(30, 34, 42, 120);
    p.strokeWeight(4);
    p.rect(0, 0, width, height);
    p.pop();
  }
}
