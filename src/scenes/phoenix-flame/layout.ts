import { Sprite } from "pixi.js";
import { FlameConfig } from "./config";

export function layoutBackgroundSprite(
  background: Sprite,
  width: number,
  height: number,
): void {
  const textureWidth = background.texture.width || FlameConfig.render.textureSizeFallback;
  const textureHeight =
    background.texture.height || FlameConfig.render.textureSizeFallback;
  const coverScale = Math.max(width / textureWidth, height / textureHeight);
  background.position.set(width / 2, height / 2);
  background.scale.set(coverScale);
}

export function layoutTorchSprite(torch: Sprite, width: number, height: number): void {
  const textureWidth = torch.texture.width || FlameConfig.render.textureSizeFallback;
  const textureHeight = torch.texture.height || FlameConfig.render.textureSizeFallback;
  const containScale = Math.min(width / textureWidth, height / textureHeight);
  torch.position.set(
    width / 2,
    height / FlameConfig.placement.torchYRatio + FlameConfig.placement.yOffset,
  );
  torch.scale.set(containScale / FlameConfig.placement.torchScaleDivisor);
}
