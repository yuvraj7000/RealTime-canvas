export type Tool = "select" | "pen" | "rect" | "ellipse" | "hand";

export type ShapeType = "pen" | "rect" | "ellipse" | "image";

export type Viewport = {
  x: number;
  y: number;
  scale: number;
};

export type BaseShape = {
  id: string;
  type: ShapeType;
  roomId: string;
  userId: string;
  stroke: string;
  strokeWidth: number;
  createdAt: number;
  updatedAt: number;
};

export type PenShape = BaseShape & {
  type: "pen";
  x: number;
  y: number;
  points: number[];
};

export type RectShape = BaseShape & {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EllipseShape = BaseShape & {
  type: "ellipse";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageShape = BaseShape & {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
  imagePublicId?: string;
};

export type Shape = PenShape | RectShape | EllipseShape | ImageShape;

export type Operation = {
  id: string;
  type: "create" | "update" | "delete";
  shapeId: string;
  before?: Shape;
  after?: Shape;
};
