"use client";

import { useEffect, useMemo, useState } from "react";
import { Line } from "react-konva";
import type { Viewport } from "@/types/whiteboard";

type CanvasGridProps = {
  width: number;
  height: number;
  viewport: Viewport;
  gridSize?: number;
};

type GridColors = {
  minor: string;
  major: string;
};

export function CanvasGrid({ width, height, viewport, gridSize = 80 }: CanvasGridProps) {
  const [colors, setColors] = useState<GridColors>({
    minor: "#e5e3df",
    major: "#d6d2cc",
  });

  useEffect(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const minor = styles.getPropertyValue("--grid").trim();
    const major = styles.getPropertyValue("--grid-strong").trim();

    setColors({
      minor: minor || "#e5e3df",
      major: major || "#d6d2cc",
    });
  }, []);

  const { minorLines, majorLines } = useMemo(() => {
    if (!width || !height) {
      return { minorLines: [], majorLines: [] };
    }

    const scale = viewport.scale;
    const left = -viewport.x / scale;
    const top = -viewport.y / scale;
    const right = left + width / scale;
    const bottom = top + height / scale;

    const minorLines: Array<{ points: number[]; key: string }> = [];
    const majorLines: Array<{ points: number[]; key: string }> = [];

    const startX = Math.floor(left / gridSize) * gridSize;
    const startY = Math.floor(top / gridSize) * gridSize;

    for (let x = startX; x <= right; x += gridSize) {
      const isMajor = Math.round(x / gridSize) % 5 === 0;
      const line = { points: [x, top, x, bottom], key: `v-${x}` };
      if (isMajor) {
        majorLines.push(line);
      } else {
        minorLines.push(line);
      }
    }

    for (let y = startY; y <= bottom; y += gridSize) {
      const isMajor = Math.round(y / gridSize) % 5 === 0;
      const line = { points: [left, y, right, y], key: `h-${y}` };
      if (isMajor) {
        majorLines.push(line);
      } else {
        minorLines.push(line);
      }
    }

    return { minorLines, majorLines };
  }, [gridSize, height, viewport.scale, viewport.x, viewport.y, width]);

  return (
    <>
      {minorLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke={colors.minor}
          strokeWidth={1}
          listening={false}
        />
      ))}
      {majorLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke={colors.major}
          strokeWidth={1.2}
          listening={false}
        />
      ))}
    </>
  );
}
