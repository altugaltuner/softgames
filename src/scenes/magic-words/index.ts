import { Application } from "pixi.js";
import type { ManagedScene } from "../../types/App";
import { MagicWordsScene } from "./scene";

export { preloadMagicWordsCache } from "./cache";

export async function createMagicWordsScene(app: Application): Promise<ManagedScene> {
  const scene = new MagicWordsScene(app);
  return scene.init();
}