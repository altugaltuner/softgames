import { Container, Sprite, Texture } from "pixi.js";
import { FlameConfig } from "./config";
import type { FireParticle, FireParticleSystem } from "./type";

export function createFireCircle(
  radius = FlameConfig.fireTemplate.radius,
  hotspotOffsetY = FlameConfig.fireTemplate.hotspotOffsetY,
): Sprite {
  const size = radius * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const fallback = new Sprite(Texture.WHITE);
    fallback.anchor.set(FlameConfig.fireTemplate.fallback.anchor);
    fallback.width = size;
    fallback.height = size;
    fallback.tint = FlameConfig.fireTemplate.fallback.tint;
    return fallback;
  }

  const hotspotY = radius + hotspotOffsetY;
  const gradient = ctx.createRadialGradient(
    radius,
    hotspotY,
    0,
    radius,
    radius,
    radius,
  );

  for (const stop of FlameConfig.fireTemplate.gradientStops) {
    gradient.addColorStop(stop.offset, stop.color);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const sprite = new Sprite(Texture.from(canvas));
  sprite.anchor.set(FlameConfig.fireTemplate.fallback.anchor);
  return sprite;
}

export function createFireParticleSystem(
  particleTexture: Texture,
  maxParticles = FlameConfig.maxParticles,
): FireParticleSystem {

  const layer = new Container();
  const particles: FireParticle[] = [];
  let centerX = 0;
  let centerY = 0;
  let isCenterInitialized = false;

  for (let i = 0; i < maxParticles; i += 1) {
    const sprite = new Sprite(particleTexture);
    sprite.anchor.set(FlameConfig.particle.anchor);
    layer.addChild(sprite);
    const particle: FireParticle = {
      sprite,
      lifeMs: 0,
      maxLifeMs: 0,
      velocityX: 0,
      velocityY: 0,
      startScale: FlameConfig.particle.defaultScale,
      endScale: FlameConfig.particle.defaultScale,
    };
    resetParticle(particle, centerX, centerY, true);
    particles.push(particle);
  }

  return {
    layer,
    update: (deltaMs: number): void => {
      for (const particle of particles) {
        particle.lifeMs += deltaMs;
        if (particle.lifeMs >= particle.maxLifeMs * FlameConfig.particle.resetEarlyRatio) {
          // Recycle before full expiry to keep the flame visually continuous.
          resetParticle(particle, centerX, centerY, false);
          continue;
        }

        const progress = particle.lifeMs / particle.maxLifeMs;
        particle.sprite.x += particle.velocityX * deltaMs;
        particle.sprite.y += particle.velocityY * deltaMs;
        particle.sprite.alpha = initialPeakFade(progress);
        particle.sprite.scale.set(
          particle.startScale + (particle.endScale - particle.startScale) * progress,
        );
      }
    },
    setCenter: (width: number, height: number): void => {
      centerX = width * FlameConfig.emitter.xRatio;
      centerY =
        height * FlameConfig.emitter.yRatio +
        Math.min(
          FlameConfig.emitter.yOffsetMax,
          height * FlameConfig.emitter.yOffsetHeightRatio,
        ) +
        FlameConfig.placement.yOffset;

      if (!isCenterInitialized) {
        for (const particle of particles) {
          resetParticle(particle, centerX, centerY, true);
        }
        isCenterInitialized = true;
      }
    },
  };
}

function resetParticle(
  particle: FireParticle,
  centerX: number,
  centerY: number,
  initialSpawn: boolean,
): void {
  particle.maxLifeMs = randomRange(
    FlameConfig.particle.lifeMs.min,
    FlameConfig.particle.lifeMs.max,
  );
  particle.lifeMs = initialSpawn
    ? randomRange(0, particle.maxLifeMs * FlameConfig.particle.initialLifePortion)
    : 0;
  particle.velocityX = randomRange(
    FlameConfig.particle.velocityX.min,
    FlameConfig.particle.velocityX.max,
  );
  particle.velocityY = randomRange(
    FlameConfig.particle.velocityY.min,
    FlameConfig.particle.velocityY.max,
  );
  particle.startScale = randomRange(
    FlameConfig.particle.startScale.min,
    FlameConfig.particle.startScale.max,
  );
  particle.endScale = randomRange(
    FlameConfig.particle.endScale.min,
    FlameConfig.particle.endScale.max,
  );
  particle.sprite.x =
    centerX +
    randomRange(
      FlameConfig.emitter.spawnJitterX.min,
      FlameConfig.emitter.spawnJitterX.max,
    );
  particle.sprite.y =
    centerY +
    randomRange(
      FlameConfig.emitter.spawnJitterY.min,
      FlameConfig.emitter.spawnJitterY.max,
    );
  particle.sprite.alpha = initialSpawn
    ? Math.max(FlameConfig.particle.initialAlpha, 1 - particle.lifeMs / particle.maxLifeMs)
    : FlameConfig.particle.initialAlpha;
  particle.sprite.scale.set(particle.startScale);
  particle.sprite.blendMode = FlameConfig.particle.blendMode;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function initialPeakFade(progress: number): number {
  const peak = FlameConfig.fade.peakAlpha;
  // Quick rise + slower fall gives a natural flicker curve.
  if (progress < FlameConfig.fade.peakUntilRatio) {
    return (
      FlameConfig.fade.startAlpha +
      ((peak - FlameConfig.fade.startAlpha) * progress) /
      FlameConfig.fade.peakUntilRatio
    );
  }
  return (
    peak *
    (1 - (progress - FlameConfig.fade.peakUntilRatio) /
      (1 - FlameConfig.fade.peakUntilRatio))
  );
}