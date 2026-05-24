import { prisma } from "../db/prisma.js";

export const ensureRoom = async (roomId: string) => {
  const existing = await prisma.room.findUnique({ where: { id: roomId } });
  if (existing) {
    return existing;
  }

  return prisma.room.create({ data: { id: roomId } });
};

export const listRoomShapes = async (roomId: string) => {
  return prisma.shape.findMany({ where: { roomId } });
};
