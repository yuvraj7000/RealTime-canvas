"use client";

import { useEffect, useRef } from "react";
import { WhiteboardCanvas } from "@/components/canvas/WhiteboardCanvas";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { disconnectSocket, getSocket } from "@/socket/client";
import { fromSocketShape, toSocketShape, type SocketShape } from "@/socket/types";
import { useWhiteboardStore } from "@/store/whiteboard-store";

type WhiteboardShellProps = {
  roomId: string;
};

export function WhiteboardShell({ roomId }: WhiteboardShellProps) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const setRoomId = useWhiteboardStore((state) => state.setRoomId);
  const setRandomIdentity = useWhiteboardStore(
    (state) => state.setRandomIdentity
  );
  const userName = useWhiteboardStore((state) => state.userName);
  const userColor = useWhiteboardStore((state) => state.userColor);
  const toastMessage = useWhiteboardStore((state) => state.toastMessage);
  const setToast = useWhiteboardStore((state) => state.setToast);
  const hydrateShapes = useWhiteboardStore((state) => state.hydrateShapes);
  const applyRemoteCreate = useWhiteboardStore(
    (state) => state.applyRemoteCreate
  );
  const applyRemoteUpdate = useWhiteboardStore(
    (state) => state.applyRemoteUpdate
  );
  const applyRemoteDelete = useWhiteboardStore(
    (state) => state.applyRemoteDelete
  );

  const isSocketShape = (value: unknown): value is SocketShape => {
    return typeof value === "object" && value !== null && "id" in value;
  };

  useEffect(() => {
    setRoomId(roomId);
  }, [roomId, setRoomId]);

  useEffect(() => {
    setRandomIdentity();
  }, [setRandomIdentity]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("room:join", roomId, (payload: { shapes?: unknown[] }) => {
      const shapes = (payload?.shapes ?? [])
        .filter(isSocketShape)
        .map((shape) => fromSocketShape(shape));
      hydrateShapes(shapes);
    });

    socket.on("shape:create", (payload: SocketShape) => {
      applyRemoteCreate(fromSocketShape(payload));
    });

    socket.on("shape:update", (payload: SocketShape) => {
      applyRemoteUpdate(fromSocketShape(payload));
    });

    socket.on("shape:delete", (payload: { shapeId: string }) => {
      applyRemoteDelete(payload.shapeId);
    });

    return () => {
      socket.off("shape:create");
      socket.off("shape:update");
      socket.off("shape:delete");
      disconnectSocket();
    };
  }, [applyRemoteCreate, applyRemoteDelete, applyRemoteUpdate, hydrateShapes, roomId]);

  useEffect(() => {
    const unsubscribe = useWhiteboardStore.subscribe((state) => {
      const change = state.lastChange;
      if (!change || change.source !== "local") {
        return;
      }

      const socket = socketRef.current;
      if (!socket) {
        return;
      }

      if (change.action === "create" && change.shape) {
        socket.emit("shape:create", toSocketShape(change.shape));
      }

      if (change.action === "update" && change.shape) {
        socket.emit("shape:update", toSocketShape(change.shape));
      }

      if (change.action === "delete" && change.shapeId) {
        socket.emit("shape:delete", { roomId, shapeId: change.shapeId });
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [setToast, toastMessage]);

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 -top-35 h-85 w-140 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.18),transparent_70%)] blur-3xl animate-[drift_12s_ease-in-out_infinite]" />
        <div className="absolute -left-32 bottom-8 h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.16),transparent_70%)] blur-2xl" />
      </div>

      <WhiteboardCanvas />
      <Toolbar />

      <div className="pointer-events-none absolute bottom-6 left-6 flex items-center gap-2 rounded-full bg-(--toolbar) px-4 py-2 text-xs text-(--muted) shadow-sm ring-1 ring-(--toolbar-border)">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: userColor }}
        />
        <span>Room {roomId} • You are {userName}</span>
      </div>

      {toastMessage ? (
        <div className="pointer-events-none absolute bottom-6 right-6 rounded-full bg-foreground px-4 py-2 text-xs text-background shadow-lg animate-[rise_300ms_ease-out]">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
