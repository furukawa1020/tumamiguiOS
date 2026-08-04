import type { Point } from "@/utils/geometry";

export const HAND_LANDMARK_INDEX = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  PINKY_MCP: 17,
} as const;

export const FACE_LANDMARK_INDEX = {
  UPPER_INNER_LIP: 13,
  LOWER_INNER_LIP: 14,
  LEFT_MOUTH_CORNER: 61,
  RIGHT_MOUTH_CORNER: 291,
} as const;

export const getLandmarkPoint = (
  landmarks: readonly { x: number; y: number }[] | undefined | null,
  index: number,
): Point => {
  const landmark = landmarks?.[index];
  if (!landmark) {
    return { x: 0.5, y: 0.5 };
  }
  return { x: landmark.x, y: landmark.y };
};
