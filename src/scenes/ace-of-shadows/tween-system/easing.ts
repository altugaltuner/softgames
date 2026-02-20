import type { EaseInOutCubicConfig } from "../../../types/Easing";

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
