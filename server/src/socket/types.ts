import { z } from "zod";

export const shapeSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  type: z.enum(["pen", "rect", "ellipse", "image"]),
  userId: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  points: z.array(z.number()),
  stroke: z.string(),
  strokeWidth: z.number(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ShapePayload = z.infer<typeof shapeSchema>;

export const cursorSchema = z.object({
  roomId: z.string(),
  userId: z.string(),
  x: z.number(),
  y: z.number(),
  name: z.string(),
  color: z.string(),
});

export type CursorPayload = z.infer<typeof cursorSchema>;

export const viewportSchema = z.object({
  roomId: z.string(),
  userId: z.string(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
});

export type ViewportPayload = z.infer<typeof viewportSchema>;

export const operationSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  userId: z.string(),
  type: z.enum(["create", "update", "delete"]),
  shapeId: z.string(),
  before: shapeSchema.optional(),
  after: shapeSchema.optional(),
});

export type OperationPayload = z.infer<typeof operationSchema>;
