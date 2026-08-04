export class CameraPermissionError extends Error {
  constructor(message = "Camera access was denied.") {
    super(message);
    this.name = "CameraPermissionError";
  }
}

export class CameraNotFoundError extends Error {
  constructor(message = "No camera device found.") {
    super(message);
    this.name = "CameraNotFoundError";
  }
}

export class CameraUnavailableError extends Error {
  constructor(message = "Camera is unavailable.") {
    super(message);
    this.name = "CameraUnavailableError";
  }
}

