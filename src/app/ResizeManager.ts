import type { ResizePayload } from "../types/App";

class ResizeManager {
  private readonly designWidth: number;
  private readonly designHeight: number;
  private readonly onResize: (payload: ResizePayload) => void;
  private readonly vv: VisualViewport | null;

  constructor(
    designWidth: number,
    designHeight: number,
    onResize: (payload: ResizePayload) => void,
  ) {
    this.designWidth = designWidth;
    this.designHeight = designHeight;
    this.onResize = onResize;
    this.vv = window.visualViewport;
  }

  start = (): void => {
    if (this.vv) {
      this.vv.addEventListener("resize", this.fire);
      this.vv.addEventListener("scroll", this.fire);
    }
    window.addEventListener("resize", this.fire);
    window.addEventListener("orientationchange", this.fire);
    this.fire();
  };

  stop = (): void => {
    if (this.vv) {
      this.vv.removeEventListener("resize", this.fire);
      this.vv.removeEventListener("scroll", this.fire);
    }
    window.removeEventListener("resize", this.fire);
    window.removeEventListener("orientationchange", this.fire);
  };

  private fire = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(width / this.designWidth, height / this.designHeight);
    this.onResize({ width, height, scale });
  };
}

export function createResizeManager(
  designWidth: number,
  designHeight: number,
  onResize: (payload: ResizePayload) => void,
): () => void {
  const manager = new ResizeManager(designWidth, designHeight, onResize);
  manager.start();
  return manager.stop;
}