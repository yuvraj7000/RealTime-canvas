export const createId = (prefix = "id") => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  const fallback = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${fallback}`;
};
