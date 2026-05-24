"use client";

import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Ellipse, Image as KonvaImage, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useWhiteboardStore } from "@/store/whiteboard-store";
import type { Shape } from "@/types/whiteboard";
import { clamp, rectFromPoints } from "@/utils/geometry";
import { createId } from "@/utils/id";

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

const useImageElement = (src: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = src;

    return () => {
      img.onload = null;
    };
  }, [src]);

  return image;
};

type ImageNodeProps = {
  shape: Extract<Shape, { type: "image" }>;
  activeTool: string;
  userId: string;
  onSelect: () => void;
  onDragEnd: (node: Konva.Node) => void;
  onTransformEnd: (node: Konva.Node) => void;
  registerRef: (node: Konva.Node | null) => void;
};

const ImageNode = ({
  shape,
  activeTool,
  userId,
  onSelect,
  onDragEnd,
  onTransformEnd,
  registerRef,
}: ImageNodeProps) => {
  const image = useImageElement(shape.imageUrl);
  const isOwner = shape.userId === userId;
  const isSelectable = activeTool === "select" && isOwner;

  return (
    <KonvaImage
      ref={registerRef}
      image={image ?? undefined}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      draggable={isSelectable}
      onMouseDown={(event) => {
        if (isSelectable) {
          event.cancelBubble = true;
          onSelect();
        }
      }}
      onDragEnd={(event) => onDragEnd(event.target)}
      onTransformEnd={(event) => onTransformEnd(event.target)}
    />
  );
};

export function WhiteboardCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Record<string, Konva.Node>>({});
  const rafRef = useRef<number | null>(null);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [lastPanPoint, setLastPanPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const shapes = useWhiteboardStore((state) => state.shapes);
  const order = useWhiteboardStore((state) => state.order);
  const activeTool = useWhiteboardStore((state) => state.activeTool);
  const strokeColor = useWhiteboardStore((state) => state.strokeColor);
  const strokeWidth = useWhiteboardStore((state) => state.strokeWidth);
  const selectedId = useWhiteboardStore((state) => state.selectedId);
  const viewport = useWhiteboardStore((state) => state.viewport);
  const roomId = useWhiteboardStore((state) => state.roomId);
  const userId = useWhiteboardStore((state) => state.userId);
  const setSelectedId = useWhiteboardStore((state) => state.setSelectedId);
  const setViewport = useWhiteboardStore((state) => state.setViewport);
  const createShape = useWhiteboardStore((state) => state.createShape);
  const recordCreation = useWhiteboardStore((state) => state.recordCreation);
  const updateShape = useWhiteboardStore((state) => state.updateShape);
  const deleteShape = useWhiteboardStore((state) => state.deleteShape);

  const orderedShapes = useMemo(() => {
    return order.map((id) => shapes[id]).filter(Boolean);
  }, [order, shapes]);

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePressed(true);
      }

      if (event.key === "Delete" && selectedId) {
        const selectedShape = shapes[selectedId];
        if (selectedShape?.userId === userId) {
          deleteShape(selectedId);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [deleteShape, selectedId]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) {
      return;
    }

    if (!selectedId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const selectedShape = shapes[selectedId];
    if (!selectedShape || selectedShape.type === "pen") {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    if (selectedShape.userId !== userId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = shapeRefs.current[selectedId];
    if (node) {
      transformer.nodes([node]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId, shapes]);

  const getPointer = () => {
    const stage = stageRef.current;
    if (!stage) {
      return null;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return null;
    }

    return {
      x: (pointer.x - viewport.x) / viewport.scale,
      y: (pointer.y - viewport.y) / viewport.scale,
    };
  };

  const isPanning = activeTool === "hand" || isSpacePressed;

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.08;
    const newScale = clamp(
      viewport.scale * (direction > 0 ? scaleBy : 1 / scaleBy),
      MIN_SCALE,
      MAX_SCALE
    );

    const mousePointTo = {
      x: (pointer.x - viewport.x) / viewport.scale,
      y: (pointer.y - viewport.y) / viewport.scale,
    };

    setViewport({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
      scale: newScale,
    });
  };

  const handleStagePointerDown = () => {
    const point = getPointer();
    if (!point) {
      return;
    }

    if (isPanning) {
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (pointer) {
        setLastPanPoint(pointer);
      }
      return;
    }

    if (activeTool === "select") {
      setSelectedId(null);
      return;
    }

    const baseShape = {
      id: createId("shape"),
      roomId,
      userId,
      stroke: strokeColor,
      strokeWidth,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (activeTool === "pen") {
      const shape: Shape = {
        ...baseShape,
        type: "pen",
        x: 0,
        y: 0,
        points: [point.x, point.y],
      };
      createShape(shape, false);
      setDrawingId(shape.id);
      return;
    }

    if (activeTool === "rect") {
      const shape: Shape = {
        ...baseShape,
        type: "rect",
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      };
      createShape(shape, false);
      setDrawingId(shape.id);
      setStartPoint(point);
      return;
    }

    if (activeTool === "ellipse") {
      const shape: Shape = {
        ...baseShape,
        type: "ellipse",
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      };
      createShape(shape, false);
      setDrawingId(shape.id);
      setStartPoint(point);
    }
  };

  const handleStagePointerMove = () => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    if (lastPanPoint) {
      const dx = pointer.x - lastPanPoint.x;
      const dy = pointer.y - lastPanPoint.y;
      setViewport({
        x: viewport.x + dx,
        y: viewport.y + dy,
        scale: viewport.scale,
      });
      setLastPanPoint(pointer);
      return;
    }

    if (!drawingId) {
      return;
    }

    const point = getPointer();
    if (!point) {
      return;
    }

    if (activeTool === "pen") {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const current = shapes[drawingId];
        if (!current || current.type !== "pen") {
          return;
        }

        const nextPoints = current.points.concat([point.x, point.y]);
        updateShape(drawingId, { points: nextPoints }, false);
      });
      return;
    }

    if ((activeTool === "rect" || activeTool === "ellipse") && startPoint) {
      const rect = rectFromPoints(startPoint, point);
      updateShape(
        drawingId,
        {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        false
      );
    }
  };

  const handleStagePointerUp = () => {
    setLastPanPoint(null);

    if (drawingId) {
      const finalShape = shapes[drawingId];
      if (
        finalShape &&
        (finalShape.type === "rect" || finalShape.type === "ellipse")
      ) {
        if (finalShape.width < 2 || finalShape.height < 2) {
          deleteShape(drawingId);
          setDrawingId(null);
          setStartPoint(null);
          return;
        }
      }

      if (finalShape) {
        recordCreation(drawingId);
      }
    }

    setDrawingId(null);
    setStartPoint(null);
  };

  const handleShapeDragEnd = (shape: Shape, node: Konva.Node) => {
    if (shape.userId !== userId) {
      return;
    }

    updateShape(shape.id, {
      x: node.x(),
      y: node.y(),
    });
  };

  const handleTransformEnd = (shape: Shape, node: Konva.Node) => {
    if (shape.type === "pen") {
      return;
    }

    if (shape.userId !== userId) {
      return;
    }

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    let width = node.width();
    let height = node.height();

    if (shape.type === "ellipse") {
      const ellipse = node as Konva.Ellipse;
      width = ellipse.radiusX() * 2;
      height = ellipse.radiusY() * 2;
    }

    width = Math.max(4, width * scaleX);
    height = Math.max(4, height * scaleY);

    updateShape(shape.id, {
      x: node.x(),
      y: node.y(),
      width,
      height,
    });
  };

  const cursor = isPanning
    ? "cursor-grab"
    : activeTool === "pen"
    ? "cursor-crosshair"
    : activeTool === "rect" || activeTool === "ellipse"
    ? "cursor-cell"
    : "cursor-default";

  return (
    <div className={`h-full w-full ${cursor}`}>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        x={viewport.x}
        y={viewport.y}
        onWheel={handleWheel}
        onMouseDown={handleStagePointerDown}
        onMouseMove={handleStagePointerMove}
        onMouseUp={handleStagePointerUp}
      >
        <Layer>
          {orderedShapes.map((shape) => {
            if (shape.type === "pen") {
              return (
                <Line
                  key={shape.id}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                  points={shape.points}
                  x={shape.x}
                  y={shape.y}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  draggable={activeTool === "select" && shape.userId === userId}
                  onMouseDown={(event) => {
                    if (activeTool === "select" && shape.userId === userId) {
                      event.cancelBubble = true;
                      setSelectedId(shape.id);
                    }
                  }}
                  onDragEnd={(event) => handleShapeDragEnd(shape, event.target)}
                />
              );
            }

            if (shape.type === "image") {
              return (
                <ImageNode
                  key={shape.id}
                  shape={shape}
                  activeTool={activeTool}
                  userId={userId}
                  onSelect={() => setSelectedId(shape.id)}
                  onDragEnd={(node) => handleShapeDragEnd(shape, node)}
                  onTransformEnd={(node) => handleTransformEnd(shape, node)}
                  registerRef={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                />
              );
            }

            if (shape.type === "rect") {
              return (
                <Rect
                  key={shape.id}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[shape.id] = node;
                    }
                  }}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  cornerRadius={8}
                  draggable={activeTool === "select" && shape.userId === userId}
                  onMouseDown={(event) => {
                    if (activeTool === "select" && shape.userId === userId) {
                      event.cancelBubble = true;
                      setSelectedId(shape.id);
                    }
                  }}
                  onDragEnd={(event) => handleShapeDragEnd(shape, event.target)}
                  onTransformEnd={(event) =>
                    handleTransformEnd(shape, event.target)
                  }
                />
              );
            }

            return (
              <Ellipse
                key={shape.id}
                ref={(node) => {
                  if (node) {
                    shapeRefs.current[shape.id] = node;
                  }
                }}
                x={shape.x + shape.width / 2}
                y={shape.y + shape.height / 2}
                radiusX={shape.width / 2}
                radiusY={shape.height / 2}
                stroke={shape.stroke}
                strokeWidth={shape.strokeWidth}
                draggable={activeTool === "select" && shape.userId === userId}
                onMouseDown={(event) => {
                  if (activeTool === "select" && shape.userId === userId) {
                    event.cancelBubble = true;
                    setSelectedId(shape.id);
                  }
                }}
                onDragEnd={(event) => {
                  const node = event.target;
                  if (shape.userId === userId) {
                    updateShape(shape.id, {
                      x: node.x() - shape.width / 2,
                      y: node.y() - shape.height / 2,
                    });
                  }
                }}
                onTransformEnd={(event) =>
                  handleTransformEnd(shape, event.target)
                }
              />
            );
          })}
          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 8 || newBox.height < 8) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}
