export class CameraPermissionError extends Error {
  constructor(message = "カメラ権限が拒否されました。") {
    super(message);
    this.name = "CameraPermissionError";
  }
}

export class CameraNotFoundError extends Error {
  constructor(message = "カメラが見つかりません。") {
    super(message);
    this.name = "CameraNotFoundError";
  }
}

export class CameraUnavailableError extends Error {
  constructor(message = "カメラの初期化に失敗しました。") {
    super(message);
    this.name = "CameraUnavailableError";
  }
}
