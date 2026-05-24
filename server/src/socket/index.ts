import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { ensureRoom, listRoomShapes } from "../rooms/room-service.js";
import { deleteShape, upsertShape } from "../shapes/shape-service.js";
import { parseOrigins } from "../utils/origins.js";
import { deleteCloudinaryImage } from "../utils/cloudinary.js";
import {
  cursorSchema,
  operationSchema,
  shapeSchema,
  viewportSchema,
} from "./types.js";

export const initSocket = (server: HttpServer, corsOrigin: string) => {
  const origins = parseOrigins(corsOrigin);
  const io = new Server(server, {
    cors: {
      origin: origins,
      credentials: true,
    },
  });

  const roomMembers = new Map<string, Set<string>>();
  const roomImageTrash = new Map<string, Set<string>>();

  const addMember = (roomId: string, socketId: string) => {
    const members = roomMembers.get(roomId) ?? new Set<string>();
    members.add(socketId);
    roomMembers.set(roomId, members);
  };

  const removeMember = async (roomId: string, socketId: string) => {
    const members = roomMembers.get(roomId);
    if (!members) {
      return;
    }

    members.delete(socketId);
    if (members.size > 0) {
      return;
    }

    roomMembers.delete(roomId);

    const trash = roomImageTrash.get(roomId);
    if (trash) {
      await Promise.all(Array.from(trash).map((publicId) => deleteCloudinaryImage(publicId)));
      roomImageTrash.delete(roomId);
    }
  };

  const addImageTrash = (roomId: string, publicId: string) => {
    const trash = roomImageTrash.get(roomId) ?? new Set<string>();
    trash.add(publicId);
    roomImageTrash.set(roomId, trash);
  };

  io.on("connection", (socket) => {
    socket.on("room:join", async (roomId: string, callback?: (data: unknown) => void) => {
      if (!roomId) {
        return;
      }

      await ensureRoom(roomId);
      socket.join(roomId);
      addMember(roomId, socket.id);
      const shapes = await listRoomShapes(roomId);
      callback?.({ shapes });
      socket.to(roomId).emit("presence:join", { socketId: socket.id });
    });

    socket.on("shape:create", async (payload) => {
      const parsed = shapeSchema.safeParse(payload);
      if (!parsed.success) {
        return;
      }

      await upsertShape(parsed.data);
      socket.to(parsed.data.roomId).emit("shape:create", parsed.data);
    });

    socket.on("shape:update", async (payload) => {
      const parsed = shapeSchema.safeParse(payload);
      if (!parsed.success) {
        return;
      }

      await upsertShape(parsed.data);
      socket.to(parsed.data.roomId).emit("shape:update", parsed.data);
    });

    socket.on("shape:delete", async (payload: { roomId: string; shapeId: string }) => {
      if (!payload?.roomId || !payload?.shapeId) {
        return;
      }

      const deleted = await deleteShape(payload.shapeId);
      if (deleted?.type === "image" && deleted.imagePublicId) {
        addImageTrash(payload.roomId, deleted.imagePublicId);
      }
      socket.to(payload.roomId).emit("shape:delete", payload);
    });

    socket.on("cursor:update", (payload) => {
      const parsed = cursorSchema.safeParse(payload);
      if (!parsed.success) {
        return;
      }

      socket.to(parsed.data.roomId).emit("cursor:update", parsed.data);
    });

    socket.on("viewport:update", (payload) => {
      const parsed = viewportSchema.safeParse(payload);
      if (!parsed.success) {
        return;
      }

      socket.to(parsed.data.roomId).emit("viewport:update", parsed.data);
    });

    socket.on("operation:record", async (payload) => {
      const parsed = operationSchema.safeParse(payload);
      if (!parsed.success) {
        return;
      }

      await io.to(parsed.data.roomId).emit("operation:record", parsed.data);
    });

    socket.on("disconnect", () => {
      socket.rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("presence:leave", { socketId: socket.id });
          void removeMember(roomId, socket.id);
        }
      });
    });
  });

  return io;
};
