export type ResizePayload = {
  width: number;
  height: number;
  scale: number;
};

export function createResizeManager(
  designWidth: number,
  designHeight: number,
  onResize: (payload: ResizePayload) => void,
): () => void {
  const fire = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(width / designWidth, height / designHeight);
    onResize({ width, height, scale });
  };

  const vv = window.visualViewport;

  if (vv) {
    vv.addEventListener("resize", fire);
    vv.addEventListener("scroll", fire);
  }
  window.addEventListener("resize", fire);
  window.addEventListener("orientationchange", fire);

  fire();

  return () => {
    if (vv) {
      vv.removeEventListener("resize", fire);
      vv.removeEventListener("scroll", fire);
    }
    window.removeEventListener("resize", fire);
    window.removeEventListener("orientationchange", fire);
  };
}
