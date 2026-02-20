import { Sprite, Texture } from "pixi.js";

export function createFireCircle(radius = 150, hotspotOffsetY = 0): Sprite {
  // Texture boyutu: sprite merkezden cizildigi icin cap = radius * 2.
  const size = radius * 2;
  // Radial gradient'i tarayici canvas'inda uretiyoruz.
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Canvas context yoksa tek renk fallback sprite don.
    const fallback = new Sprite(Texture.WHITE);
    fallback.anchor.set(0.5);
    fallback.width = size;
    fallback.height = size;
    fallback.tint = 0xff7a1a;
    return fallback;
  }

  // Icten disa dogru yumusak gecisli alev gradient'i.
  // hotspotOffsetY > 0 yaparsan parlak merkez asagi kayar.
  const hotspotY = radius + hotspotOffsetY;
  const gradient = ctx.createRadialGradient(
    radius,
    hotspotY,
    0,
    radius,
    radius,
    radius,
  );
  // Daha yumusak gecis icin daha fazla stop ve kademeli alpha dususu.
  gradient.addColorStop(0.0, "rgba(255,255,210,0.98)");
  gradient.addColorStop(0.12, "rgba(255,235,155,0.95)");
  gradient.addColorStop(0.28, "rgba(255,190,95,0.88)");
  gradient.addColorStop(0.48, "rgba(255,135,50,0.72)");
  gradient.addColorStop(0.72, "rgba(255,95,25,0.42)");
  gradient.addColorStop(0.9, "rgba(255,85,20,0.14)");
  gradient.addColorStop(1.0, "rgba(255,85,20,0)");

  // Gradient'i tum canvas'a bas.
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Uretilen canvas'i pixi Texture/Sprite'a cevir.
  const sprite = new Sprite(Texture.from(canvas));
  // Pozisyonlama kolayligi icin merkezden anchor.
  sprite.anchor.set(0.5);
  return sprite;
}