import type { Shape } from "@/types/whiteboard";

export type SocketShape = {
  id: string;
  roomId: string;
  type: "pen" | "rect" | "ellipse" | "image";
  userId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  points: number[];
  stroke: string;
  strokeWidth: number;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: number;
  updatedAt: number;
};

export const toSocketShape = (shape: Shape): SocketShape => {
  if (shape.type === "pen") {
    return {
      ...shape,
      width: 0,
      height: 0,
      points: shape.points,
    };
  }

  return {
    ...shape,
    points: [],
    imageUrl: shape.type === "image" ? shape.imageUrl : undefined,
    imagePublicId: shape.type === "image" ? shape.imagePublicId : undefined,
  };
};

export const fromSocketShape = (shape: SocketShape): Shape => {
  if (shape.type === "pen") {
    return {
      id: shape.id,
      type: "pen",
      roomId: shape.roomId,
      userId: shape.userId,
      x: shape.x,
      y: shape.y,
      points: shape.points,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      createdAt: shape.createdAt,
      updatedAt: shape.updatedAt,
    };
  }

  if (shape.type === "image") {
    return {
      id: shape.id,
      type: "image",
      roomId: shape.roomId,
      userId: shape.userId,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      imageUrl: shape.imageUrl ?? "",
      imagePublicId: shape.imagePublicId,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      createdAt: shape.createdAt,
      updatedAt: shape.updatedAt,
    };
  }

  return {
    id: shape.id,
    type: shape.type,
    roomId: shape.roomId,
    userId: shape.userId,
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    createdAt: shape.createdAt,
    updatedAt: shape.updatedAt,
  };
};
