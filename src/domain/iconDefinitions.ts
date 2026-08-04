import type { DesktopIcon } from "@/domain/types";
import type { Point } from "@/utils/geometry";

export interface IconDefinition {
  id: string;
  label: string;
  type: string;
  hue: number;
}

export const ICON_DEFINITIONS: IconDefinition[] = [
  { id: "browser", label: "Browser", type: "browser", hue: 196 },
  { id: "photo", label: "Photo", type: "photo", hue: 14 },
  { id: "music", label: "Music", type: "music", hue: 270 },
  { id: "mail", label: "Mail", type: "mail", hue: 120 },
  { id: "memo", label: "Memo", type: "memo", hue: 24 },
  { id: "clock", label: "Clock", type: "clock", hue: 2 },
  { id: "settings", label: "Settings", type: "settings", hue: 45 },
  { id: "folder", label: "Folder", type: "folder", hue: 185 },
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

