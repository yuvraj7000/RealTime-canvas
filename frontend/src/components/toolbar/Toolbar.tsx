"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  Circle,
  Hand,
  ImagePlus,
  MousePointer2,
  Moon,
  Pencil,
  Redo2,
  Share2,
  Square,
  Sun,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWhiteboardStore } from "@/store/whiteboard-store";
import type { Tool } from "@/types/whiteboard";
import { cn } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { createId } from "@/utils/id";

const toolConfig: Array<{
  tool: Tool;
  label: string;
  icon: typeof MousePointer2;
}> = [
  { tool: "select", label: "Select", icon: MousePointer2 },
  { tool: "pen", label: "Pen", icon: Pencil },
  { tool: "rect", label: "Rectangle", icon: Square },
  { tool: "ellipse", label: "Ellipse", icon: Circle },
  { tool: "hand", label: "Hand", icon: Hand },
];

export function Toolbar() {
  const activeTool = useWhiteboardStore((state) => state.activeTool);
  const strokeColor = useWhiteboardStore((state) => state.strokeColor);
  const strokeWidth = useWhiteboardStore((state) => state.strokeWidth);
  const undoStack = useWhiteboardStore((state) => state.undoStack);
  const redoStack = useWhiteboardStore((state) => state.redoStack);
  const roomId = useWhiteboardStore((state) => state.roomId);
  const viewport = useWhiteboardStore((state) => state.viewport);
  const userId = useWhiteboardStore((state) => state.userId);
  const setActiveTool = useWhiteboardStore((state) => state.setActiveTool);
  const setStrokeColor = useWhiteboardStore((state) => state.setStrokeColor);
  const setStrokeWidth = useWhiteboardStore((state) => state.setStrokeWidth);
  const undo = useWhiteboardStore((state) => state.undo);
  const redo = useWhiteboardStore((state) => state.redo);
  const createShape = useWhiteboardStore((state) => state.createShape);

  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/room/${roomId}`;
  }, [roomId]);

  const handleShare = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleImagePick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const upload = await uploadImageToCloudinary(file);
      const maxWidth = 640;
      const maxHeight = 420;
      const scale = Math.min(
        maxWidth / upload.width,
        maxHeight / upload.height,
        1
      );
      const width = Math.round(upload.width * scale);
      const height = Math.round(upload.height * scale);

      const centerX = -viewport.x / viewport.scale + window.innerWidth / 2 / viewport.scale;
      const centerY = -viewport.y / viewport.scale + window.innerHeight / 2 / viewport.scale;

      createShape({
        id: createId("shape"),
        type: "image",
        roomId,
        userId,
        x: centerX - width / 2,
        y: centerY - height / 2,
        width,
        height,
        imageUrl: upload.secure_url,
        imagePublicId: upload.public_id,
        stroke: "transparent",
        strokeWidth: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const handleThemeToggle = () => {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextIsDark);
    setIsDark(nextIsDark);
  };

  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-10 flex -translate-x-1/2 flex-col gap-3">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-(--toolbar) px-4 py-3 shadow-lg shadow-black/10 ring-1 ring-(--toolbar-border)">
        <div className="flex items-center gap-1">
          {toolConfig.map((item) => {
            const Icon = item.icon;
            const isActive = activeTool === item.tool;

            return (
              <Button
                key={item.tool}
                size="icon"
                variant="ghost"
                onClick={() => setActiveTool(item.tool)}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  "h-9 w-9 rounded-full",
                  isActive &&
                    "bg-foreground text-background hover:bg-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-(--toolbar-border) bg-white/70 px-2 py-1 text-xs dark:bg-black/50">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setStrokeWidth(Math.min(12, strokeWidth + 1))}
              title="Increase stroke"
              aria-label="Increase stroke"
              className="h-7 w-7 rounded-full"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <span className="min-w-12 text-center">Stroke {strokeWidth}px</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
              title="Decrease stroke"
              aria-label="Decrease stroke"
              className="h-7 w-7 rounded-full"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-(--toolbar-border) bg-white/70 px-2 py-1 dark:bg-black/50">
            <span
              className="h-5 w-5 rounded-full border border-black/10"
              style={{ backgroundColor: strokeColor }}
            />
            <input
              type="color"
              value={strokeColor}
              onChange={(event) => setStrokeColor(event.target.value)}
              className="h-6 w-6 cursor-pointer bg-transparent"
              aria-label="Stroke color"
            />
          </div>
        </div>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={undo}
            disabled={undoStack.length === 0}
            title="Undo"
            aria-label="Undo"
            className="h-9 w-9 rounded-full"
          >
            <Undo2 className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo"
            aria-label="Redo"
            className="h-9 w-9 rounded-full"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        <Button
          size="icon"
          variant="ghost"
          onClick={handleImagePick}
          title="Add image"
          aria-label="Add image"
          className="h-9 w-9 rounded-full"
          disabled={uploading}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={handleThemeToggle}
          title={isDark ? "Switch to light" : "Switch to dark"}
          aria-label="Toggle theme"
          className="h-9 w-9 rounded-full"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          size="sm"
          onClick={handleShare}
          title="Copy room link"
          className="h-9 rounded-full bg-foreground px-4 text-background hover:opacity-90"
        >
          <Share2 className="mr-2 h-4 w-4" />
          {copied ? "Copied" : "Share"}
        </Button>
      </div>

      <div className="pointer-events-auto mx-auto flex items-center gap-2 rounded-full bg-(--toolbar) px-4 py-2 text-xs text-(--muted) ring-1 ring-(--toolbar-border)">
        <span className="font-mono">Space</span>
        <span>to pan</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
    </div>
  );
}
