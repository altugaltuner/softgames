export type EaseInOutCubicConfig = {
  midpoint: number;
  initialMultiplier: number;
  endScale: number;
  power: number;
  endDivisor: number;
};

export function easeInOutCubic(
  t: number,
  config: EaseInOutCubicConfig,
): number {
  if (t < config.midpoint) {
    return config.initialMultiplier * t * t * t;
  }
  return (
    1 -
    Math.pow(-config.endScale * t + config.endScale, config.power) /
    config.endDivisor
  );
}
