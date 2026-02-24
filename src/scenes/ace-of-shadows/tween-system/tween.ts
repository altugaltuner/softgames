import { gsap } from "gsap";
import { Container, Sprite } from "pixi.js";
import type { SequentialFlightConfig } from "./types";

class TweenLauncher {
  private readonly cardsCt: Container;
  private readonly cfg: SequentialFlightConfig;
  private isStarted = false;
  private travelX = 0;
  private centerY = 0;
  private readonly queue: Sprite[];
  private readonly launchCalls: gsap.core.Tween[] = [];
  private readonly flightTweens = new Map<Sprite, gsap.core.Tween>();
  private readonly landedYBySprite = new Map<Sprite, number>();
  private launchIdx = 0;
  private readonly flights = new Map<
    Sprite,
    {
      fromX: number;
      fromY: number;
      targetY: number;
      progress: number;
    }
  >();

  constructor(
    cardContainer: Container,
    sprites: Sprite[],
    config: SequentialFlightConfig,
  ) {
    this.cardsCt = cardContainer;
    this.cfg = config;
    this.queue = [...sprites].reverse();
  }

  update = (width: number, height: number): void => {
    const wRatio = width / this.cfg.responsiveScaleBreakpointWidth;
    const hRatio = height / this.cfg.responsiveScaleBreakpointHeight;
    const scale = this.cfg.scale * Math.min(1, wRatio, hRatio);
    this.cardsCt.scale.set(scale);

    const startX = width * this.cfg.startXRatio - width / 2;
    const endX = width * this.cfg.endXRatio - width / 2;
    this.centerY = height * this.cfg.centerYRatio - height / 2;
    // Normalize travel distance into local container space after scale is applied.
    this.travelX = (endX - startX) / scale;
    this.cardsCt.position.set(startX, this.centerY);

    for (const [sprite, targetY] of this.landedYBySprite) {
      sprite.position.set(this.travelX, targetY);
    }
    for (const [sprite, flight] of this.flights) {
      this.updateFlightPosition(sprite, flight);
    }

    if (!this.isStarted) {
      this.isStarted = true;
      this.scheduleLaunches();
    }
  };

  stop = (): void => {
    for (const call of this.launchCalls) {
      call.kill();
    }
    this.launchCalls.length = 0;

    for (const tween of this.flightTweens.values()) {
      tween.kill();
    }
    this.flightTweens.clear();
    this.flights.clear();
  };

  private scheduleLaunches(): void {
    const intervalSec = this.cfg.launchIntervalMs / 1000;
    // Launch one immediately, then queue the rest on fixed delays.
    this.launch();
    for (let i = 1; i < this.queue.length + 1; i += 1) {
      const call = gsap.delayedCall(intervalSec * i, this.launch);
      this.launchCalls.push(call);
    }
  }

  private launch = (): void => {
    const sprite = this.queue.shift();
    if (!sprite) {
      return;
    }

    this.cardsCt.setChildIndex(sprite, this.cardsCt.children.length - 1);
    const targetY = this.cfg.landedStackOffsetY * this.launchIdx;
    this.launchIdx += 1;
    const flight = {
      fromX: sprite.position.x,
      fromY: sprite.position.y,
      targetY,
      progress: 0,
    };
    this.flights.set(sprite, flight);

    const tween = gsap.to(flight, {
      progress: 1,
      duration: this.cfg.durationMs / 1000,
      ease: this.cfg.easing as gsap.EaseString,
      onUpdate: () => {
        this.updateFlightPosition(sprite, flight);
      },
      onComplete: () => {
        // Persist final landed Y so future resizes can reposition settled cards.
        sprite.position.set(this.travelX, flight.targetY);
        this.landedYBySprite.set(sprite, flight.targetY);
        this.flights.delete(sprite);
        this.flightTweens.delete(sprite);
      },
    });

    this.flightTweens.set(sprite, tween);
  };

  private updateFlightPosition(
    sprite: Sprite,
    flight: { fromX: number; fromY: number; targetY: number; progress: number },
  ): void {
    const arcY = Math.sin(Math.PI * flight.progress) * this.cfg.arcLiftY;
    sprite.position.x = flight.fromX + (this.travelX - flight.fromX) * flight.progress;
    sprite.position.y =
      flight.fromY + (flight.targetY - flight.fromY) * flight.progress - arcY;
  }
}

export function createLauncher(
  cardContainer: Container,
  sprites: Sprite[],
  config: SequentialFlightConfig,
): { update: (width: number, height: number) => void; stop: () => void } {
  const launcher = new TweenLauncher(cardContainer, sprites, config);
  return {
    update: launcher.update,
    stop: launcher.stop,
  };
}