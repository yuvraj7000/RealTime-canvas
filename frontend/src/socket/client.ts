"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (socket) {
    return socket;
  }

  const url =
    process.env.NEXT_PUBLIC_SERVER_URL?.trim() || "http://localhost:4000";

  socket = io(url, {
    transports: ["websocket"],
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
