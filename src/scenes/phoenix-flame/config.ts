export const FlameConfig = {
  maxParticles: 10,

  fireTemplate: {
    radius: 150,
    hotspotOffsetY: 18,
  },

  background: {
    color: 0x0b0d12,
    overscanMultiplier: 3,
  },

  placement: {
    yOffset: -100,
  },

  emitter: {
    xRatio: 0.5,
    yRatio: 0.5,
    yOffsetMax: 80,
    yOffsetHeightRatio: 0.1,
    spawnJitterX: { min: -18, max: 18 },
    spawnJitterY: { min: 4, max: 8 },
  },

  particle: {
    resetEarlyRatio: 0.85,
    lifeMs: { min: 400, max: 800 },
    initialLifePortion: 0.1,
    velocityX: { min: -0.1, max: 0.1 },
    velocityY: { min: -0.6, max: -0.4 },
    startScale: { min: 0.85, max: 0.95 },
    endScale: { min: 0.05, max: 0.2 },
    initialAlpha: 0.1,
    anchor: 0.5,
    defaultScale: 1,
    blendMode: "add",
  },

  fade: {
    peakAlpha: 0.9,
    startAlpha: 0.1,
    peakUntilRatio: 0.25,
  },
} as const;

