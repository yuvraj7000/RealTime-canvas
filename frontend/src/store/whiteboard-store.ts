"use client";

import { create } from "zustand";
import type { Operation, Shape, Tool, Viewport } from "@/types/whiteboard";
import { createId } from "@/utils/id";

const copyShape = (shape: Shape) => {
  if (typeof structuredClone === "function") {
    return structuredClone(shape);
  }

  return JSON.parse(JSON.stringify(shape)) as Shape;
};

const guestNames = [
  "Amber Fox",
  "Blue Tiger",
  "Copper Finch",
  "Green Panda",
  "Indigo Lynx",
  "Mint Heron",
  "Nova Wolf",
  "Sienna Owl",
];

const guestColors = [
  "#f97316",
  "#0ea5e9",
  "#22c55e",
  "#f43f5e",
  "#8b5cf6",
  "#14b8a6",
  "#eab308",
  "#f59e0b",
];

const pickRandom = (values: string[]) => {
  return values[Math.floor(Math.random() * values.length)];
};

const createGuestIdentity = () => {
  return {
    name: pickRandom(guestNames),
    color: pickRandom(guestColors),
  };
};

const applyCreate = (state: WhiteboardState, shape: Shape) => {
  const shapes = { ...state.shapes, [shape.id]: shape };
  const order = state.order.includes(shape.id)
    ? state.order
    : [...state.order, shape.id];

  return { shapes, order };
};

const applyDelete = (state: WhiteboardState, shapeId: string) => {
  if (!state.shapes[shapeId]) {
    return { shapes: state.shapes, order: state.order };
  }

  const rest = { ...state.shapes };
  delete rest[shapeId];
  const order = state.order.filter((id) => id !== shapeId);

  return { shapes: rest, order };
};

const applyUpdate = (state: WhiteboardState, shape: Shape) => {
  if (!state.shapes[shape.id]) {
    return { shapes: state.shapes, order: state.order };
  }

  const shapes = { ...state.shapes, [shape.id]: shape };

  return { shapes, order: state.order };
};

export type WhiteboardState = {
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  shapes: Record<string, Shape>;
  order: string[];
  activeTool: Tool;
  strokeColor: string;
  strokeWidth: number;
  selectedId: string | null;
  viewport: Viewport;
  undoStack: Operation[];
  redoStack: Operation[];
  toastMessage: string | null;
  lastChange: {
    action: "create" | "update" | "delete";
    shape?: Shape;
    shapeId?: string;
    source: "local" | "remote";
  } | null;
  setRoomId: (roomId: string) => void;
  setRandomIdentity: () => void;
  setToast: (message: string | null) => void;
  setActiveTool: (tool: Tool) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setSelectedId: (shapeId: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  createShape: (shape: Shape, recordHistory?: boolean) => void;
  recordCreation: (shapeId: string) => void;
  updateShape: (
    shapeId: string,
    patch: Partial<Shape>,
    recordHistory?: boolean
  ) => void;
  deleteShape: (shapeId: string, recordHistory?: boolean) => void;
  hydrateShapes: (shapes: Shape[]) => void;
  applyRemoteCreate: (shape: Shape) => void;
  applyRemoteUpdate: (shape: Shape) => void;
  applyRemoteDelete: (shapeId: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
};

const defaultIdentity = {
  name: "Guest",
  color: "#94a3b8",
};

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  roomId: "local",
  userId: createId("user"),
  userName: defaultIdentity.name,
  userColor: defaultIdentity.color,
  shapes: {},
  order: [],
  activeTool: "select",
  strokeColor: "#1f2937",
  strokeWidth: 2,
  selectedId: null,
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
  },
  undoStack: [],
  redoStack: [],
  toastMessage: null,
  lastChange: null,
  setRoomId: (roomId) => set({ roomId }),
  setRandomIdentity: () =>
    set(() => {
      const identity = createGuestIdentity();
      return {
        userName: identity.name,
        userColor: identity.color,
      };
    }),
  setToast: (message) => set({ toastMessage: message }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setSelectedId: (shapeId) => set({ selectedId: shapeId }),
  setViewport: (viewport) => set({ viewport }),
  createShape: (shape, recordHistory = true) =>
    set((state) => {
      const now = Date.now();
      const nextShape = {
        ...shape,
        createdAt: shape.createdAt || now,
        updatedAt: now,
      };

      const shapes = { ...state.shapes, [shape.id]: nextShape };
      const order = state.order.includes(shape.id)
        ? state.order
        : [...state.order, shape.id];

      const undoStack = recordHistory
        ? [
            ...state.undoStack,
            {
              id: createId("op"),
              type: "create" as const,
              shapeId: shape.id,
              after: copyShape(nextShape),
            },
          ]
        : state.undoStack;

      return {
        shapes,
        order,
        undoStack,
        redoStack: recordHistory ? [] : state.redoStack,
        lastChange: {
          action: "create",
          shape: nextShape,
          shapeId: shape.id,
          source: "local",
        },
      };
    }),
  recordCreation: (shapeId) =>
    set((state) => {
      const shape = state.shapes[shapeId];
      if (!shape) {
        return state;
      }

      return {
        undoStack: [
          ...state.undoStack,
          {
            id: createId("op"),
            type: "create" as const,
            shapeId,
            after: copyShape(shape),
          },
        ],
        redoStack: [],
        lastChange: {
          action: "create",
          shape,
          shapeId,
          source: "local",
        },
      };
    }),
  updateShape: (shapeId, patch, recordHistory = true) =>
    set((state) => {
      const current = state.shapes[shapeId];
      if (!current) {
        return state;
      }

      const nextShape = {
        ...current,
        ...patch,
        updatedAt: Date.now(),
      } as Shape;

      const undoStack = recordHistory
        ? [
            ...state.undoStack,
            {
              id: createId("op"),
              type: "update" as const,
              shapeId,
              before: copyShape(current),
              after: copyShape(nextShape),
            },
          ]
        : state.undoStack;

      return {
        shapes: { ...state.shapes, [shapeId]: nextShape },
        undoStack,
        redoStack: recordHistory ? [] : state.redoStack,
        lastChange: {
          action: "update",
          shape: nextShape,
          shapeId,
          source: "local",
        },
      };
    }),
  deleteShape: (shapeId, recordHistory = true) =>
    set((state) => {
      const current = state.shapes[shapeId];
      if (!current) {
        return state;
      }

      const { shapes, order } = applyDelete(state, shapeId);
      const undoStack = recordHistory
        ? [
            ...state.undoStack,
            {
              id: createId("op"),
              type: "delete" as const,
              shapeId,
              before: copyShape(current),
            },
          ]
        : state.undoStack;

      return {
        shapes,
        order,
        undoStack,
        redoStack: recordHistory ? [] : state.redoStack,
        selectedId: state.selectedId === shapeId ? null : state.selectedId,
        lastChange: {
          action: "delete",
          shapeId,
          source: "local",
        },
      };
    }),
  hydrateShapes: (nextShapes) =>
    set(() => ({
      shapes: nextShapes.reduce<Record<string, Shape>>((acc, shape) => {
        acc[shape.id] = shape;
        return acc;
      }, {}),
      order: nextShapes.map((shape) => shape.id),
      lastChange: null,
    })),
  applyRemoteCreate: (shape) =>
    set((state) => ({
      ...applyCreate(state, shape),
      lastChange: {
        action: "create",
        shape,
        shapeId: shape.id,
        source: "remote",
      },
    })),
  applyRemoteUpdate: (shape) =>
    set((state) => ({
      ...applyUpdate(state, shape),
      lastChange: {
        action: "update",
        shape,
        shapeId: shape.id,
        source: "remote",
      },
    })),
  applyRemoteDelete: (shapeId) =>
    set((state) => ({
      ...applyDelete(state, shapeId),
      lastChange: {
        action: "delete",
        shapeId,
        source: "remote",
      },
    })),
  undo: () =>
    set((state) => {
      const operation = state.undoStack[state.undoStack.length - 1];
      if (!operation) {
        return state;
      }

      const nextUndo = state.undoStack.slice(0, -1);
      let nextState = { shapes: state.shapes, order: state.order };
      let lastChange: WhiteboardState["lastChange"] = null;

      if (operation.type === "delete" && operation.before?.type === "image") {
        return {
          ...state,
          undoStack: nextUndo,
          lastChange: null,
          toastMessage: "Deleted images cannot be undone.",
        };
      }

      if (operation.type === "create") {
        nextState = applyDelete(state, operation.shapeId);
        lastChange = {
          action: "delete",
          shapeId: operation.shapeId,
          source: "local",
        };
      }

      if (operation.type === "update" && operation.before) {
        nextState = applyUpdate(state, operation.before);
        lastChange = {
          action: "update",
          shape: operation.before,
          shapeId: operation.shapeId,
          source: "local",
        };
      }

      if (operation.type === "delete" && operation.before) {
        nextState = applyCreate(state, operation.before);
        lastChange = {
          action: "create",
          shape: operation.before,
          shapeId: operation.shapeId,
          source: "local",
        };
      }

      return {
        ...state,
        ...nextState,
        undoStack: nextUndo,
        redoStack: [...state.redoStack, operation],
        lastChange,
      };
    }),
  redo: () =>
    set((state) => {
      const operation = state.redoStack[state.redoStack.length - 1];
      if (!operation) {
        return state;
      }

      const nextRedo = state.redoStack.slice(0, -1);
      let nextState = { shapes: state.shapes, order: state.order };
      let lastChange: WhiteboardState["lastChange"] = null;

      if (operation.type === "delete" && operation.before?.type === "image") {
        return {
          ...state,
          redoStack: nextRedo,
          lastChange: null,
          toastMessage: "Deleted images cannot be redone.",
        };
      }

      if (operation.type === "create" && operation.after) {
        nextState = applyCreate(state, operation.after);
        lastChange = {
          action: "create",
          shape: operation.after,
          shapeId: operation.shapeId,
          source: "local",
        };
      }

      if (operation.type === "update" && operation.after) {
        nextState = applyUpdate(state, operation.after);
        lastChange = {
          action: "update",
          shape: operation.after,
          shapeId: operation.shapeId,
          source: "local",
        };
      }

      if (operation.type === "delete") {
        nextState = applyDelete(state, operation.shapeId);
        lastChange = {
          action: "delete",
          shapeId: operation.shapeId,
          source: "local",
        };
      }

      return {
        ...state,
        ...nextState,
        redoStack: nextRedo,
        undoStack: [...state.undoStack, operation],
        lastChange,
      };
    }),
  clear: () =>
    set({
      shapes: {},
      order: [],
      undoStack: [],
      redoStack: [],
      selectedId: null,
      toastMessage: null,
      lastChange: null,
    }),
}));
