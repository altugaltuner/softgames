import { Container, Sprite, Ticker } from "pixi.js";
import { easeInOutCubic, type EaseInOutCubicConfig } from "./Easing";

export type TweenConfig = {
  durationMs: number;
  startXRatio: number;
  endXRatio: number;
  centerYRatio: number;
  scale: number;
};

export type SequentialFlightConfig = TweenConfig & {
  launchIntervalMs: number;
  responsiveScaleBreakpointWidth: number;
  responsiveScaleBreakpointHeight: number;
  landedStackOffsetY: number;
  easing: EaseInOutCubicConfig;
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
): { updateFirstFlight: (width: number, height: number) => void; cancel: () => void } {
  let progress = 0;
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

  const updateFirstFlight = (width: number, height: number) => {
    lastWidth = width;
    lastHeight = height;
    container.scale.set(config.scale);

    if (tweenDone) {
      applyPosition(width, height, 1);
      return;
    }

    if (tweenCancel) {
      applyPosition(width, height, progress);
      return;
    }

    tweenCancel = tweenPosition(
      container,
      { x: getStartX(width), y: getCenterY(height) },
      { x: getEndX(width), y: getCenterY(height) },
      config.durationMs,
      (t) => {
        progress = t;
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
    updateFirstFlight,
    cancel: () => {
      tweenCancel?.();
      tweenCancel = null;
    },
  };
}

export function createSequentialCardLauncher(
  cardContainer: Container,
  sprites: Sprite[],
  config: SequentialFlightConfig,
): { updatePosAndScale: (width: number, height: number) => void; cancel: () => void } {
  let started = false;
  let intervalId: number | null = null;
  let currentTravelX = 0;
  let currentCenterY = 0;
  const ticker = Ticker.shared;
  let tickerActive = false;

  const pending = [...sprites].reverse();
  const landedSlots = new Map<Sprite, number>();
  let launchedCount = 0;
  const activeFlights = new Map<
    Sprite,
    {
      fromX: number;
      fromY: number;
      targetY: number;
      startedAt: number;
      durationMs: number;
    }
  >();

  const updateFlights = () => {
    const now = performance.now();
    for (const [sprite, flight] of activeFlights.entries()) {
      const tRaw = Math.min(1, (now - flight.startedAt) / flight.durationMs);
      const t = easeInOutCubic(tRaw, config.easing);
      sprite.position.x = flight.fromX + (currentTravelX - flight.fromX) * t;
      sprite.position.y = flight.fromY + (flight.targetY - flight.fromY) * t;

      if (tRaw >= 1) {
        sprite.position.set(currentTravelX, flight.targetY);
        landedSlots.set(sprite, flight.targetY);
        activeFlights.delete(sprite);
      }
    }
  };

  const launchNext = () => {
    const sprite = pending.shift();
    if (!sprite) {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }

    cardContainer.setChildIndex(sprite, cardContainer.children.length - 1);
    const targetY = config.landedStackOffsetY * launchedCount;
    launchedCount += 1;
    activeFlights.set(sprite, {
      fromX: sprite.position.x,
      fromY: sprite.position.y,
      targetY,
      startedAt: performance.now(),
      durationMs: config.durationMs,
    });

    if (!tickerActive) {
      ticker.add(updateFlights);
      tickerActive = true;
    }
  };

  const updatePosAndScale = (width: number, height: number) => {
    const widthRatio = width / config.responsiveScaleBreakpointWidth;
    const heightRatio = height / config.responsiveScaleBreakpointHeight;
    const responsiveScale = config.scale * Math.min(1, widthRatio, heightRatio);
    cardContainer.scale.set(responsiveScale);
    const startX = width * config.startXRatio;
    const endX = width * config.endXRatio;
    currentCenterY = height * config.centerYRatio;
    currentTravelX = (endX - startX) / responsiveScale;
    cardContainer.position.set(startX, currentCenterY);

    for (const [sprite, targetY] of landedSlots) {
      sprite.position.set(currentTravelX, targetY);
    }

    if (!started) {
      started = true;
      launchNext();
      intervalId = window.setInterval(launchNext, config.launchIntervalMs);
    }
  };

  return {
    updatePosAndScale,
    cancel: () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      if (tickerActive) {
        ticker.remove(updateFlights);
        tickerActive = false;
      }
      activeFlights.clear();
    },
  };
}