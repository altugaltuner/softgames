import type { Container } from "pixi.js";
import type { ResizePayload } from "../../app/type";

export type AceOfShadowsScene = {
  container: Container;
  resize: (payload: ResizePayload) => void;
  destroy: () => void;
};