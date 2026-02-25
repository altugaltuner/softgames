export const FlameConfig = {
  design: {
    width: 1280,
    height: 720,
  },

  maxParticles: 10,

  assets: {
    backgroundPath: "/assets/ui/fire-bg.webp",
    torchPath: "/assets/textures/torch.png",
    fireSoundPath: "/assets/sounds/fire-sound.mp3",
    fireSoundAlias: "phoenixFlameFireSound",
  },

  audio: {
    fireLoopVolume: 0.5,
  },

  fireTemplate: {
    radius: 150,
    hotspotOffsetY: 18,
    gradientStops: [
      { offset: 0.0, color: "rgba(255,255,210,0.98)" },
      { offset: 0.12, color: "rgba(255,235,155,0.95)" },
      { offset: 0.28, color: "rgba(255,190,95,0.88)" },
      { offset: 0.48, color: "rgba(255,135,50,0.72)" },
      { offset: 0.72, color: "rgba(255,95,25,0.42)" },
      { offset: 0.9, color: "rgba(255,85,20,0.14)" },
      { offset: 1.0, color: "rgba(255,85,20,0)" },
    ],
    fallback: {
      anchor: 0.5,
      tint: 0xff7a1a,
    },
  },

  render: {
    textureSizeFallback: 1,
  },

  background: {
    color: 0x0b0d12,
    overscanMultiplier: 3,
  },

  placement: {
    yOffset: -100,
    torchYRatio: 1.4,
    torchScaleDivisor: 2,
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

