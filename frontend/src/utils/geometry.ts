export type Point = {
  x: number;
  y: number;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export const rectFromPoints = (start: Point, end: Point) => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return { x, y, width, height };
};
