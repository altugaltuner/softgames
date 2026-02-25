import { Sprite, Texture } from "pixi.js";
import { FlameConfig } from "./config";

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