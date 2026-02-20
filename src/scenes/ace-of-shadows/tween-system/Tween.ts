import { Container, Sprite, Ticker } from "pixi.js";
import { easeInOutCubic } from "./easing";
import type {
  SequentialFlightConfig,
  TweenConfig,
  TweenHandle,
} from "../../../types/Tween";

class Tween {
  private readonly container: Container;
  private readonly config: TweenConfig;
  private progress = 0;
  private tweenDone = false;
  private tweenCancel: (() => void) | null = null;
  private lastWidth = 0;
  private lastHeight = 0;

  constructor(container: Container, config: TweenConfig) {
    this.container = container;
    this.config = config;
  }

  updateFirstFlight = (width: number, height: number): void => {
    this.lastWidth = width;
    this.lastHeight = height;
    this.container.scale.set(this.config.scale);

    if (this.tweenDone) {
      this.applyPosition(width, height, 1);
      return;
    }

    if (this.tweenCancel) {
      this.applyPosition(width, height, this.progress);
      return;
    }

    this.tweenCancel = tweenPosition(
      this.container,
      { x: this.getStartX(width), y: this.getCenterY(height) },
      { x: this.getEndX(width), y: this.getCenterY(height) },
      this.config.durationMs,
      (t) => {
        this.progress = t;
        this.applyPosition(this.lastWidth, this.lastHeight, t);
      },
      () => {
        this.tweenDone = true;
        this.progress = 1;
        this.tweenCancel = null;
      },
    ).cancel;
  };

  cancel = (): void => {
    this.tweenCancel?.();
    this.tweenCancel = null;
  };

  private getStartX(w: number): number {
    return w * this.config.startXRatio;
  }

  private getEndX(w: number): number {
    return w * this.config.endXRatio;
  }

  private getCenterY(h: number): number {
    return h * this.config.centerYRatio;
  }

  private applyPosition(w: number, h: number, t: number): void {
    const startX = this.getStartX(w);
    const endX = this.getEndX(w);
    const centerY = this.getCenterY(h);
    this.container.position.set(startX + (endX - startX) * t, centerY);
  }
}

class SequentialCardLauncher {
  private readonly cardContainer: Container;
  private readonly sprites: Sprite[];
  private readonly config: SequentialFlightConfig;
  private readonly ticker = Ticker.shared;
  private started = false;
  private intervalId: number | null = null;
  private currentTravelX = 0;
  private currentCenterY = 0;
  private tickerActive = false;
  private readonly pending: Sprite[];
  private readonly landedSlots = new Map<Sprite, number>();
  private launchedCount = 0;
  private readonly activeFlights = new Map<
    Sprite,
    {
      fromX: number;
      fromY: number;
      targetY: number;
      startedAt: number;
      durationMs: number;
    }
  >();

  constructor(
    cardContainer: Container,
    sprites: Sprite[],
    config: SequentialFlightConfig,
  ) {
    this.cardContainer = cardContainer;
    this.sprites = sprites;
    this.config = config;
    this.pending = [...this.sprites].reverse();
  }

  updatePosAndScale = (width: number, height: number): void => {
    const widthRatio = width / this.config.responsiveScaleBreakpointWidth;
    const heightRatio = height / this.config.responsiveScaleBreakpointHeight;
    const responsiveScale = this.config.scale * Math.min(1, widthRatio, heightRatio);
    this.cardContainer.scale.set(responsiveScale);
    const startX = width * this.config.startXRatio;
    const endX = width * this.config.endXRatio;
    this.currentCenterY = height * this.config.centerYRatio;
    this.currentTravelX = (endX - startX) / responsiveScale;
    this.cardContainer.position.set(startX, this.currentCenterY);

    for (const [sprite, targetY] of this.landedSlots) {
      sprite.position.set(this.currentTravelX, targetY);
    }

    if (!this.started) {
      this.started = true;
      this.launchNext();
      this.intervalId = window.setInterval(this.launchNext, this.config.launchIntervalMs);
    }
  };

  cancel = (): void => {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.tickerActive) {
      this.ticker.remove(this.updateFlights);
      this.tickerActive = false;
    }
    this.activeFlights.clear();
  };

  private updateFlights = (): void => {
    const now = performance.now();
    for (const [sprite, flight] of this.activeFlights.entries()) {
      const tRaw = Math.min(1, (now - flight.startedAt) / flight.durationMs);
      const t = easeInOutCubic(tRaw, this.config.easing);
      sprite.position.x = flight.fromX + (this.currentTravelX - flight.fromX) * t;
      sprite.position.y = flight.fromY + (flight.targetY - flight.fromY) * t;

      if (tRaw >= 1) {
        sprite.position.set(this.currentTravelX, flight.targetY);
        this.landedSlots.set(sprite, flight.targetY);
        this.activeFlights.delete(sprite);
      }
    }
  };

  private launchNext = (): void => {
    const sprite = this.pending.shift();
    if (!sprite) {
      if (this.intervalId !== null) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }
      return;
    }

    this.cardContainer.setChildIndex(sprite, this.cardContainer.children.length - 1);
    const targetY = this.config.landedStackOffsetY * this.launchedCount;
    this.launchedCount += 1;
    this.activeFlights.set(sprite, {
      fromX: sprite.position.x,
      fromY: sprite.position.y,
      targetY,
      startedAt: performance.now(),
      durationMs: this.config.durationMs,
    });

    if (!this.tickerActive) {
      this.ticker.add(this.updateFlights);
      this.tickerActive = true;
    }
  };
}

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

export function createTween(
  container: Container,
  config: TweenConfig,
): { updateFirstFlight: (width: number, height: number) => void; cancel: () => void } {
  const mover = new Tween(container, config);
  return {
    updateFirstFlight: mover.updateFirstFlight,
    cancel: mover.cancel,
  };
}

export function createSequentialCardLauncher(
  cardContainer: Container,
  sprites: Sprite[],
  config: SequentialFlightConfig,
): { updatePosAndScale: (width: number, height: number) => void; cancel: () => void } {
  const launcher = new SequentialCardLauncher(cardContainer, sprites, config);
  return {
    updatePosAndScale: launcher.updatePosAndScale,
    cancel: launcher.cancel,
  };
}

