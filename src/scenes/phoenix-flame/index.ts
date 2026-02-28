import { Application, Assets, Container, Sprite, Texture } from "pixi.js";
import { sound } from "@pixi/sound";
import { createFireCircle, createFireParticleSystem } from "./fire";
import { FlameConfig } from "./config";
import { layoutBackgroundSprite, layoutTorchSprite } from "./layout";
import type { ManagedScene } from "../../app/type";

export const PhoenixFlameDesign = {
  width: FlameConfig.design.width,
  height: FlameConfig.design.height,
} as const;

export async function createPhoenixFlameScene(app: Application): Promise<ManagedScene> {

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

  const template = createFireCircle(
    FlameConfig.fireTemplate.radius,
    FlameConfig.fireTemplate.hotspotOffsetY,
  );
  // Reuse one generated texture across all particles for lower memory/GPU churn.
  const particleTexture = template.texture;
  template.destroy();
  const fireSystem = createFireParticleSystem(particleTexture);
  fireSystem.setCenter(viewportWidth, viewportHeight);

  const update = () => {
    fireSystem.update(app.ticker.deltaMS);
  };

  container.addChild(background, torch, fireSystem.layer);
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

  const [backgroundResult, torchResult] = await Promise.allSettled([
    Assets.load<Texture>(FlameConfig.assets.backgroundPath),
    Assets.load<Texture>(FlameConfig.assets.torchPath),
  ]);

  if (backgroundResult.status === "fulfilled") {
    background.texture = backgroundResult.value;
    background.alpha = 1;
    layoutBackgroundSprite(background, viewportWidth, viewportHeight);
  } else {
    background.alpha = 0;
  }

  if (torchResult.status === "fulfilled") {
    torch.texture = torchResult.value;
    torch.alpha = 1;
    layoutTorchSprite(torch, viewportWidth, viewportHeight);
  } else {
    torch.alpha = 0;
  }

  return {
    resize: ({ width, height }) => {
      viewportWidth = width;
      viewportHeight = height;
      layoutBackgroundSprite(background, width, height);
      layoutTorchSprite(torch, width, height);
      fireSystem.setCenter(width, height);

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
}

export const createScene = createPhoenixFlameScene;
export const sceneDesign = PhoenixFlameDesign;