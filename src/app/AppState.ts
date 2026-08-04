import { APP_CONFIG, initialIconGridPoints } from "@/config";
import type { DesktopIcon } from "@/domain/types";
import { makeIcons } from "@/domain/iconDefinitions";
import type { Point } from "@/utils/geometry";

export type AppMode = "idle" | "camera" | "pointer" | "error";

export interface OverlayState {
  title: string;
  subtitle: string;
  message: string;
  errorMessage: string;
  completed: boolean;
  cameraRequested: boolean;
  isPointerMode: boolean;
  debugText: string;
  mouthRadiusX: number;
  mouthRadiusY: number;
}

export interface AppState {
  mode: AppMode;
  icons: DesktopIcon[];
  mouthCenter: Point;
  mouthRadiusX: number;
  mouthRadiusY: number;
  mouthVisible: boolean;
  heldIconId: string | null;
  completed: boolean;
  errorMessage: string | null;
}

export const createInitialState = (): AppState => {
  const points = initialIconGridPoints().slice(0, APP_CONFIG.iconCount);
  const layout = points.length >= 2 ? points : [
    { x: 0.2, y: 0.4 },
    { x: 0.5, y: 0.5 },
    { x: 0.8, y: 0.45 },
  ];

  return {
    mode: "idle",
    icons: makeIcons(APP_CONFIG.iconCount, layout, APP_CONFIG.iconDefaultSize).map((icon, index) => ({
      ...icon,
      position: { x: layout[index]?.x ?? 0.5, y: layout[index]?.y ?? 0.5 },
      size: Math.max(APP_CONFIG.iconMinSize, Math.min(APP_CONFIG.iconMaxSize, APP_CONFIG.iconDefaultSize)),
    })),
    mouthCenter: { x: 0.5, y: 0.7 },
    mouthRadiusX: 70,
    mouthRadiusY: 48,
    mouthVisible: false,
    heldIconId: null,
    completed: false,
    errorMessage: null,
  };
};
