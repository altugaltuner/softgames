import { Application, Assets, Container, Sprite, Texture } from "pixi.js";
import { sound } from "@pixi/sound";
import { createFireCircle } from "./fire";
import { FlameConfig } from "./config";
import type { ManagedScene } from "../../app/type";

export const PhoenixFlameDesign = {
  width: FlameConfig.design.width,
  height: FlameConfig.design.height,
} as const;

export function createPhoenixFlameScene(app: Application): ManagedScene {
  const container = new Container();
  const background = new Sprite(Texture.WHITE);
  background.anchor.set(0.5);
  background.alpha = 0;
  background.label = "fireBackground";
  const torch = new Sprite(Texture.WHITE);
  torch.anchor.set(0.5);
  torch.alpha = 0;
  torch.label = "torch";
  let viewportWidth = app.screen.width;
  let viewportHeight = app.screen.height;
  let ownsFireSoundAlias = false;
  const particleLayer = new Container();
  const maxParticles = FlameConfig.maxParticles;
  const template = createFireCircle(
    FlameConfig.fireTemplate.radius,
    FlameConfig.fireTemplate.hotspotOffsetY,
  );
  // Reuse one generated texture across all particles for lower memory/GPU churn.
  const particleTexture = template.texture;
  template.destroy();

  type Particle = {
    sprite: Sprite;
    lifeMs: number;
    maxLifeMs: number;
    vx: number;
    vy: number;
    startScale: number;
    endScale: number;
  };

  const particles: Particle[] = [];
  let centerX = 0;
  let centerY = 0;
  updateEmitterCenter(viewportWidth, viewportHeight);

  for (let i = 0; i < maxParticles; i += 1) {
    const sprite = new Sprite(particleTexture);
    sprite.anchor.set(FlameConfig.particle.anchor);
    particleLayer.addChild(sprite);
    const particle: Particle = {
      sprite,
      lifeMs: 0,
      maxLifeMs: 0,
      vx: 0,
      vy: 0,
      startScale: FlameConfig.particle.defaultScale,
      endScale: FlameConfig.particle.defaultScale,
    };
    resetParticle(particle, true);
    particles.push(particle);
  }

  const update = () => {
    const dt = app.ticker.deltaMS;
    for (const p of particles) {
      p.lifeMs += dt;
      if (p.lifeMs >= p.maxLifeMs * FlameConfig.particle.resetEarlyRatio) {
        // Recycle before full expiry to keep the flame visually continuous.
        resetParticle(p, false);
        continue;
      }

      const t = p.lifeMs / p.maxLifeMs;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.sprite.alpha = initialPeakFade(t);
      p.sprite.scale.set(p.startScale + (p.endScale - p.startScale) * t);
    }
  };

  container.addChild(background, torch, particleLayer);
  app.stage.addChild(container);
  app.ticker.add(update);
  if (!sound.exists(FlameConfig.assets.fireSoundAlias)) {
    sound.add(FlameConfig.assets.fireSoundAlias, FlameConfig.assets.fireSoundPath);
    ownsFireSoundAlias = true;
  }
  sound.play(FlameConfig.assets.fireSoundAlias, {
    loop: true,
    volume: FlameConfig.audio.fireLoopVolume,
  });
  // Visual assets load lazily; scene still runs with graceful fallback.
  Assets.load<Texture>(FlameConfig.assets.backgroundPath)
    .then((texture) => {
      background.texture = texture;
      background.alpha = 1;
      layoutBackground(viewportWidth, viewportHeight);
    })
    .catch(() => {
      background.alpha = 0;
    });
  Assets.load<Texture>(FlameConfig.assets.torchPath)
    .then((texture) => {
      torch.texture = texture;
      torch.alpha = 1;
      layoutTorch(viewportWidth, viewportHeight);
    })
    .catch(() => {
      torch.alpha = 0;
    });

  return {
    resize: ({ width, height }) => {
      viewportWidth = width;
      viewportHeight = height;
      layoutBackground(width, height);
      layoutTorch(width, height);
      updateEmitterCenter(width, height);

    },
    destroy: () => {
      app.ticker.remove(update);
      sound.stop(FlameConfig.assets.fireSoundAlias);
      if (ownsFireSoundAlias && sound.exists(FlameConfig.assets.fireSoundAlias)) {
        sound.remove(FlameConfig.assets.fireSoundAlias);
      }
      container.destroy({ children: true });
      particleTexture.destroy(true);
    },
  };

  function resetParticle(p: Particle, initialSpawn: boolean): void {
    p.maxLifeMs = randomRange(
      FlameConfig.particle.lifeMs.min,
      FlameConfig.particle.lifeMs.max,
    );
    p.lifeMs = initialSpawn
      ? randomRange(0, p.maxLifeMs * FlameConfig.particle.initialLifePortion)
      : 0;
    p.vx = randomRange(
      FlameConfig.particle.velocityX.min,
      FlameConfig.particle.velocityX.max,
    );
    p.vy = randomRange(
      FlameConfig.particle.velocityY.min,
      FlameConfig.particle.velocityY.max,
    );
    p.startScale = randomRange(
      FlameConfig.particle.startScale.min,
      FlameConfig.particle.startScale.max,
    );
    p.endScale = randomRange(
      FlameConfig.particle.endScale.min,
      FlameConfig.particle.endScale.max,
    );
    p.sprite.x =
      centerX +
      randomRange(
        FlameConfig.emitter.spawnJitterX.min,
        FlameConfig.emitter.spawnJitterX.max,
      );
    p.sprite.y =
      centerY +
      randomRange(
        FlameConfig.emitter.spawnJitterY.min,
        FlameConfig.emitter.spawnJitterY.max,
      );
    p.sprite.alpha = initialSpawn
      ? Math.max(FlameConfig.particle.initialAlpha, 1 - p.lifeMs / p.maxLifeMs)
      : FlameConfig.particle.initialAlpha;
    p.sprite.scale.set(p.startScale);
    p.sprite.blendMode = FlameConfig.particle.blendMode;
  }

  function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  function initialPeakFade(t: number): number {
    const peak = FlameConfig.fade.peakAlpha;
    // Quick rise + slower fall gives a natural flicker curve.
    if (t < FlameConfig.fade.peakUntilRatio) {
      return (
        FlameConfig.fade.startAlpha +
        ((peak - FlameConfig.fade.startAlpha) * t) /
        FlameConfig.fade.peakUntilRatio
      );
    }
    return (
      peak *
      (1 - (t - FlameConfig.fade.peakUntilRatio) /
        (1 - FlameConfig.fade.peakUntilRatio))
    );
  }

  function layoutBackground(width: number, height: number): void {
    const textureWidth = background.texture.width || FlameConfig.render.textureSizeFallback;
    const textureHeight =
      background.texture.height || FlameConfig.render.textureSizeFallback;
    const coverScale = Math.max(width / textureWidth, height / textureHeight);
    background.position.set(width / 2, height / 2);
    background.scale.set(coverScale);
  }

  function layoutTorch(width: number, height: number): void {
    const textureWidth = torch.texture.width || FlameConfig.render.textureSizeFallback;
    const textureHeight = torch.texture.height || FlameConfig.render.textureSizeFallback;
    const containScale = Math.min(width / textureWidth, height / textureHeight);
    torch.position.set(
      width / 2,
      height / FlameConfig.placement.torchYRatio + FlameConfig.placement.yOffset,
    );
    torch.scale.set(containScale / FlameConfig.placement.torchScaleDivisor);
  }

  function updateEmitterCenter(width: number, height: number): void {
    centerX = width * FlameConfig.emitter.xRatio;
    centerY =
      height * FlameConfig.emitter.yRatio +
      Math.min(
        FlameConfig.emitter.yOffsetMax,
        height * FlameConfig.emitter.yOffsetHeightRatio,
      ) +
      FlameConfig.placement.yOffset;
  }
}

export const createScene = createPhoenixFlameScene;
export const sceneDesign = PhoenixFlameDesign;