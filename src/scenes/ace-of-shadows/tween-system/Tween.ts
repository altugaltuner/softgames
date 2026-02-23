import { Container, Sprite, Ticker } from "pixi.js";
import { easeInOutCubic } from "./easing";
import type { SequentialFlightConfig } from "./types";

class SeqLauncher {
  private readonly cardsCt: Container;
  private readonly cards: Sprite[];
  private readonly cfg: SequentialFlightConfig;
  private readonly ticker = Ticker.shared;
  private isStarted = false;
  private launchTimerId: number | null = null;
  private travelX = 0;
  private centerY = 0;
  private isTicking = false;
  private readonly queue: Sprite[];
  private readonly landedYBySprite = new Map<Sprite, number>();
  private launchIdx = 0;
  private readonly flights = new Map<
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
    this.cardsCt = cardContainer;
    this.cards = sprites;
    this.cfg = config;
    this.queue = [...this.cards].reverse();
  }

  update = (width: number, height: number): void => {
    const wRatio = width / this.cfg.responsiveScaleBreakpointWidth;
    const hRatio = height / this.cfg.responsiveScaleBreakpointHeight;
    const scale = this.cfg.scale * Math.min(1, wRatio, hRatio);
    this.cardsCt.scale.set(scale);
    // deckContainer merkezde olduğu için koordinatları merkez tabanlı hesapla
    const startX = width * this.cfg.startXRatio - width / 2;
    const endX = width * this.cfg.endXRatio - width / 2;
    this.centerY = height * this.cfg.centerYRatio - height / 2;
    this.travelX = (endX - startX) / scale;
    this.cardsCt.position.set(startX, this.centerY);

    for (const [sprite, targetY] of this.landedYBySprite) {
      sprite.position.set(this.travelX, targetY);
    }

    if (!this.isStarted) {
      this.isStarted = true;
      this.launch();
      this.launchTimerId = window.setInterval(this.launch, this.cfg.launchIntervalMs);
    }
  };

  stop = (): void => {
    if (this.launchTimerId !== null) {
      window.clearInterval(this.launchTimerId);
      this.launchTimerId = null;
    }
    if (this.isTicking) {
      this.ticker.remove(this.tick);
      this.isTicking = false;
    }
    this.flights.clear();
  };

  private tick = (): void => {
    const now = performance.now();
    for (const [sprite, flight] of this.flights.entries()) {
      const tRaw = Math.min(1, (now - flight.startedAt) / flight.durationMs);
      const t = easeInOutCubic(tRaw, this.cfg.easing);
      const arcY = Math.sin(Math.PI * tRaw) * this.cfg.arcLiftY;
      sprite.position.x = flight.fromX + (this.travelX - flight.fromX) * t;
      sprite.position.y = flight.fromY + (flight.targetY - flight.fromY) * t - arcY;

      if (tRaw >= 1) {
        sprite.position.set(this.travelX, flight.targetY);
        this.landedYBySprite.set(sprite, flight.targetY);
        this.flights.delete(sprite);
      }
    }
  };

  private launch = (): void => {
    const sprite = this.queue.shift();
    if (!sprite) {
      if (this.launchTimerId !== null) {
        window.clearInterval(this.launchTimerId);
        this.launchTimerId = null;
      }
      return;
    }

    this.cardsCt.setChildIndex(sprite, this.cardsCt.children.length - 1);
    const targetY = this.cfg.landedStackOffsetY * this.launchIdx;
    this.launchIdx += 1;
    this.flights.set(sprite, {
      fromX: sprite.position.x,
      fromY: sprite.position.y,
      targetY,
      startedAt: performance.now(),
      durationMs: this.cfg.durationMs,
    });

    if (!this.isTicking) {
      this.ticker.add(this.tick);
      this.isTicking = true;
    }
  };
}

export function createLauncher(
  cardContainer: Container,
  sprites: Sprite[],
  config: SequentialFlightConfig,
): { update: (width: number, height: number) => void; stop: () => void } {
  const launcher = new SeqLauncher(cardContainer, sprites, config);
  return {
    update: launcher.update,
    stop: launcher.stop,
  };
}