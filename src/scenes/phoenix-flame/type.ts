import type { Container, Sprite } from "pixi.js";

export type FireParticle = {
  sprite: Sprite;
  lifeMs: number;
  maxLifeMs: number;
  velocityX: number;
  velocityY: number;
  startScale: number;
  endScale: number;
};

export type FireParticleSystem = {
  layer: Container;
  update: (deltaMs: number) => void;
  setCenter: (width: number, height: number) => void;
};
