export const AceOfShadowsConfig = {
  designWidth: 600,
  designHeight: 100,
  totalCards: 144,
  stackOffsetY: -1.5,
  cardScale: 0.35,
  responsiveScaleBreakpointWidth: 1200,
  responsiveScaleBreakpointHeight: 720,
  tweenDurationMs: 2000,
  launchIntervalMs: 1000,
  startXRatio: 7 / 10,
  endXRatio: 3 / 10,
  centerYRatio: 1 / 2,
  arcLiftY: 250,
  easing: "power2.inOut",
} as const;

export const AceOfShadowsDesign = {
  woodenBackgroundPath: "/assets/ui/wooden-bg.webp",
  cardContainerPath: "/assets/ui/card-container.png",
} as const;