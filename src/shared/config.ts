export interface loadingModalController {
  show(message?: string): void;
  hide(): void;
}

export const DEFAULT_MESSAGE = "Game is loading...";

export type BackButtonOptions = {
  onClick: () => void;
};

export const BackButtonConfig = {
  containerZIndex: 100,
  text: "<",
  shape: {
    x: 15,
    y: 34,
    width: 30,
    height: 30,
    radius: 8,
  },
  fill: {
    color: 0x1f2a44,
    alpha: 1,
  },
  stroke: {
    color: 0xffffff,
    alpha: 0.75,
    width: 1,
  },
  textStyle: {
    fill: 0xffffff,
    fontSize: 18,
    fontFamily: "Bungee, sans-serif",
    fontWeight: "400",
  } as const,
  textPosition: {
    x: 22,
    y: 38,
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