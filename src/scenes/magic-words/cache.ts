import { Texture } from "pixi.js";
import { MagicWordsSceneConfig } from "./config";
import type { DialogueItem, MagicWordsApiResponse } from "./type";

const { endpointUrl: MAGIC_WORDS_ENDPOINT, bubblePath: BUBBLE_PATH } =
  MagicWordsSceneConfig.assets;

let preloadPromise: Promise<void> | null = null;
let apiDataCache: MagicWordsApiResponse | null = null;
const textureByUrl = new Map<string, Texture>();
const avatarUrlByName = new Map<string, string>();

export function preloadMagicWordsCache(): Promise<void> {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    const data = await getMagicWordsData();
    const avatarUrls = (data.avatars ?? []).map((avatar) => avatar.url);
    const urls = [BUBBLE_PATH, ...avatarUrls];

    for (const avatar of data.avatars ?? []) {
      avatarUrlByName.set(avatar.name, avatar.url);
    }

    await Promise.all(urls.map((url) => ensureTextureCached(url)));
  })();

  return preloadPromise;
}

export function getBubbleTexture(): Texture | null {
  return textureByUrl.get(BUBBLE_PATH) ?? null;
}

export async function getAvatarTextureByName(name: string): Promise<Texture | null> {
  await preloadMagicWordsCache();
  const url = avatarUrlByName.get(name);
  if (!url) {
    return null;
  }
  return textureByUrl.get(url) ?? (await ensureTextureCached(url));
}

export async function getMagicWordsDialogue(): Promise<DialogueItem[]> {
  await preloadMagicWordsCache();
  return apiDataCache?.dialogue ?? [];
}

async function getMagicWordsData(): Promise<MagicWordsApiResponse> {
  if (apiDataCache) {
    return apiDataCache;
  }

  try {
    const response = await fetch(MAGIC_WORDS_ENDPOINT);
    if (!response.ok) {
      apiDataCache = {};
      return apiDataCache;
    }
    apiDataCache = (await response.json()) as MagicWordsApiResponse;
  } catch {
    apiDataCache = {};
  }

  return apiDataCache ?? {};
}

async function ensureTextureCached(url: string): Promise<Texture | null> {
  const existing = textureByUrl.get(url);
  if (existing) {
    return existing;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const texture = Texture.from(bitmap);
    textureByUrl.set(url, texture);
    return texture;
  } catch {
    return null;
  }
}