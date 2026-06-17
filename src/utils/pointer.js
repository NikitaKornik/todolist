export function isCoarsePointerDevice() {
  return (
    typeof window.matchMedia === "function" &&
    Boolean(window.matchMedia("(pointer: coarse)")?.matches)
  );
}
