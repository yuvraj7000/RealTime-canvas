export const parseOrigins = (raw: string) => {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};
