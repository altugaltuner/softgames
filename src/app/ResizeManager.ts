import { Application } from "pixi.js";

export type ResizePayload = {
  width: number;
  height: number;
  scale: number;
};

export function createResizeManager(
  app: Application,
  designWidth: number,
  designHeight: number,
  onResize: (payload: ResizePayload) => void,
): () => void {
  const handleResize = () => {
    const width = app.screen.width;
    const height = app.screen.height;
    const scale = Math.min(width / designWidth, height / designHeight);
    onResize({ width, height, scale });
  };

  window.addEventListener("resize", handleResize);
  handleResize();

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}
