import { Application } from "pixi.js";
import type { ManagedScene } from "../../app/type";
import { MagicWordsScene } from "./scene";

export { preloadMagicWordsCache } from "./cache";
export const MagicWordsDesign = {
  width: 640,
  height: 360,
} as const;

async function ensureMagicWordsFontsReady(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load('400 48px "Bungee"'),
      document.fonts.load('400 18px "Bungee"'),
      document.fonts.load('400 12px "Bungee"'),
      document.fonts.load('400 8px "Aldrich"'),
    ]);
  } catch {
    console.error("Failed to load magic words fonts");
  }
}

export async function createMagicWordsScene(app: Application): Promise<ManagedScene> {
  await ensureMagicWordsFontsReady();
  const scene = new MagicWordsScene(app);
  return scene.init();
}

export const createScene = createMagicWordsScene;
export const sceneDesign = MagicWordsDesign;