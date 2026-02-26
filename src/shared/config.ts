export const DEFAULT_MESSAGE = "Game is loading...";

export const BackButtonConfig = {
  containerZIndex: 100,
  text: "<",
  shape: {
    x: 15,
    y: 34,
    width: 30,
    height: 30,
    radius: 6,
  },
  fill: {
    color: 0x000000,
    alpha: 0.75,
  },
  stroke: {
    color: 0xffffff,
    alpha: 0.75,
    width: 2,
  },
  textStyle: {
    fill: 0xffffff,
    fontSize: 16,
    fontFamily: "Bungee, sans-serif",
    fontWeight: "700",
  } as const,
  textPosition: {
    x: 24,
    y: 39,
  },
} as const;

export const FpsHudConfig = {
  containerZIndex: 1000,
  initialText: "FPS: 0",
  textPrefix: "FPS:",
  updateIntervalMs: 200,
  textStyle: {
    fill: 0xffffff,
    fontSize: 18,
    fontFamily: "Bungee, sans-serif",
    fontWeight: "400",
  } as const,
  textPosition: {
    x: 12,
    y: 8,
  },
} as const;

export const FullScreenConfig = {
  containerZIndex: 100,
  text: "[ ]",
  shape: {
    x: 0,
    y: 0,
    width: 36,
    height: 30,
    radius: 6,
  },
  fill: {
    color: 0x000000,
    alpha: 0.75,
  },
  stroke: {
    color: 0xffffff,
    alpha: 0.75,
    width: 2,
  },
  buttonPosition: {
    x: 55,
    y: 34,
  },
  textStyle: {
    fill: 0xffffff,
    fontSize: 18,
    fontFamily: "Bungee, sans-serif",
    fontWeight: "700",
  } as const,
  textPosition: {
    x: 63,
    y: 38,
  },
} as const;

export const SharedFontDescriptors = [
  '400 16px "Bungee"',
  '700 16px "Bungee"',
  '400 18px "Bungee"',
  '700 18px "Bungee"',
  '400 12px "Aldrich"',
] as const;