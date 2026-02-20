import { Container, Ticker } from "pixi.js";

export type TweenConfig = {
  durationMs: number;
  startXRatio: number;
  endXRatio: number;
  centerYRatio: number;
  scale: number;
};

export type TweenHandle = {
  cancel: () => void;
};

export function tweenPosition(
  target: { position: { x: number; y: number } },
  from: { x: number; y: number },
  to: { x: number; y: number },
  durationMs: number,
  onProgress?: (t: number) => void,
  onComplete?: () => void,
): TweenHandle {
  const ticker = Ticker.shared;
  const start = performance.now();

  target.position.x = from.x;
  target.position.y = from.y;

  const update = () => {
    const now = performance.now();
    const t = Math.min(1, (now - start) / durationMs);
    target.position.x = from.x + (to.x - from.x) * t;
    target.position.y = from.y + (to.y - from.y) * t;
    onProgress?.(t);

    if (t >= 1) {
      ticker.remove(update);
      onComplete?.();
    }
  };

  ticker.add(update);

  return {
    cancel: () => {
      ticker.remove(update);
    },
  };
}

export function createStackMover(
  container: Container,
  config: TweenConfig,
): { update: (width: number, height: number) => void; cancel: () => void } {
  let progress = 0; // 0 = başlangıç, 1 = bitiş
  let tweenDone = false;
  let tweenCancel: (() => void) | null = null;
  let lastWidth = 0;
  let lastHeight = 0;

  const getStartX = (w: number) => w * config.startXRatio;
  const getEndX = (w: number) => w * config.endXRatio;
  const getCenterY = (h: number) => h * config.centerYRatio;

  const applyPosition = (w: number, h: number, t: number) => {
    const startX = getStartX(w);
    const endX = getEndX(w);
    const centerY = getCenterY(h);
    container.position.set(
      startX + (endX - startX) * t,
      centerY,
    );
  };

  const update = (width: number, height: number) => {
    lastWidth = width;
    lastHeight = height;
    container.scale.set(config.scale);

    if (tweenDone) {
      applyPosition(width, height, 1);
      return;
    }

    // Tween zaten çalışıyorsa, sadece pozisyonu güncelle (progress'i koru)
    if (tweenCancel) {
      applyPosition(width, height, progress);
      return;
    }

    // İlk kez: tween başlat
    tweenCancel = tweenPosition(
      container,
      { x: getStartX(width), y: getCenterY(height) },
      { x: getEndX(width), y: getCenterY(height) },
      config.durationMs,
      (t) => {
        progress = t;
        // Tween sırasında boyut değiştiyse, pozisyonu yeni boyuta göre hesapla
        applyPosition(lastWidth, lastHeight, t);
      },
      () => {
        tweenDone = true;
        progress = 1;
        tweenCancel = null;
      },
    ).cancel;
  };

  return {
    update,
    cancel: () => {
      tweenCancel?.();
      tweenCancel = null;
    },
  };
}
