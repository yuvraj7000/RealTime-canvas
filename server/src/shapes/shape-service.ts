import { prisma } from "../db/prisma.js";
import type { ShapePayload } from "../socket/types.js";
import { deleteCloudinaryImage } from "../utils/cloudinary.js";

export const upsertShape = async (shape: ShapePayload) => {
  const payload = {
    id: shape.id,
    roomId: shape.roomId,
    type: shape.type,
    userId: shape.userId,
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    points: shape.points,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    imageUrl: shape.imageUrl ?? null,
    imagePublicId: shape.imagePublicId ?? null,
    createdAt: new Date(shape.createdAt),
    updatedAt: new Date(shape.updatedAt),
  };

  return prisma.shape.upsert({
    where: { id: shape.id },
    update: payload,
    create: payload,
  });
};

export const deleteShape = async (shapeId: string) => {
  const existing = await prisma.shape.findUnique({ where: { id: shapeId } });

  if (!existing) {
    return null;
  }

  await prisma.shape.delete({ where: { id: shapeId } });
  return existing;
};
