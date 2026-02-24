import { Sprite, Texture } from "pixi.js";

export function createFireCircle(radius = 150, hotspotOffsetY = 0): Sprite {
  const size = radius * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const fallback = new Sprite(Texture.WHITE);
    fallback.anchor.set(0.5);
    fallback.width = size;
    fallback.height = size;
    fallback.tint = 0xff7a1a;
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

  gradient.addColorStop(0.0, "rgba(255,255,210,0.98)");
  gradient.addColorStop(0.12, "rgba(255,235,155,0.95)");
  gradient.addColorStop(0.28, "rgba(255,190,95,0.88)");
  gradient.addColorStop(0.48, "rgba(255,135,50,0.72)");
  gradient.addColorStop(0.72, "rgba(255,95,25,0.42)");
  gradient.addColorStop(0.9, "rgba(255,85,20,0.14)");
  gradient.addColorStop(1.0, "rgba(255,85,20,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const sprite = new Sprite(Texture.from(canvas));
  sprite.anchor.set(0.5);
  return sprite;
}