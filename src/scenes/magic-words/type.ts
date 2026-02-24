import type { Container, Sprite, Text, TextStyle, Texture } from "pixi.js";
import type { MagicWordsSceneConfig } from "./config";

export type AvatarItem = {
  name: string;
  url: string;
};

export type EmojiItem = {
  name: string;
  url: string;
};

export type DialogueItem = {
  name: string;
  text: string;
};

export type MagicWordsApiResponse = {
  avatars?: AvatarItem[];
  emojis?: EmojiItem[];
  emojies?: EmojiItem[];
  dialogue?: DialogueItem[];
};

export type DialogueSegment =
  | { kind: "text"; value: string }
  | { kind: "emoji"; name: string };

export type TextStyleInput = TextStyle | ConstructorParameters<typeof TextStyle>[0];

export type InlineDialogRenderOptions = {
  textStyle: TextStyleInput;
  resolution: number;
  maxWidth?: number;
  emojiSize?: number;
  lineHeight?: number;
  fallbackEmojiName?: string;
};

export type EmojiTextureLookup = (name: string) => Texture | null;

export type AvatarSlot = {
  container: Container;
  dialogueContainer: Container;
  dialogueContent: Container;
  bubble: Sprite;
  avatar: Sprite;
  nameText: Text;
  baseScale: number;
  side: "left" | "right";
};

export type SpeakerName = keyof typeof MagicWordsSceneConfig.avatar.slots;
