import type { DesktopIcon } from "@/domain/types";
import type { Point } from "@/utils/geometry";

export interface IconDefinition {
  id: string;
  label: string;
  type: string;
  hue: number;
}

export const ICON_DEFINITIONS: IconDefinition[] = [
  { id: "browser", label: "ブラウザ", type: "browser", hue: 196 },
  { id: "photo", label: "写真", type: "photo", hue: 14 },
  { id: "music", label: "音楽", type: "music", hue: 270 },
  { id: "mail", label: "メール", type: "mail", hue: 120 },
  { id: "memo", label: "メモ", type: "memo", hue: 24 },
  { id: "clock", label: "時計", type: "clock", hue: 2 },
  { id: "settings", label: "設定", type: "settings", hue: 45 },
  { id: "folder", label: "フォルダ", type: "folder", hue: 185 },
];

export const makeIcons = (
  count: number,
  layoutPoints: Point[],
  iconSize: number,
): DesktopIcon[] => {
  return ICON_DEFINITIONS.slice(0, count).map((definition, index) => {
    const point = layoutPoints[index] ?? { x: 0.5, y: 0.5 };
    return {
      id: definition.id,
      label: definition.label,
      type: definition.type,
      position: { x: point.x, y: point.y },
      initialPosition: { x: point.x, y: point.y },
      size: iconSize,
      state: "IDLE",
      zIndex: index + 1,
      grabOffset: { x: 0, y: 0 },
      animationProgress: 0,
      visualSeed: (index * 97 + 13) % 360,
    } as DesktopIcon;
  });
};
