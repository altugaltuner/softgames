export type TweenConfig = {
  durationMs: number;
  startXRatio: number;
  endXRatio: number;
  centerYRatio: number;
  scale: number;
};

export type SequentialFlightConfig = TweenConfig & {
  launchIntervalMs: number;
  responsiveScaleBreakpointWidth: number;
  responsiveScaleBreakpointHeight: number;
  landedStackOffsetY: number;
  arcLiftY: number;
  easing: string;
};
