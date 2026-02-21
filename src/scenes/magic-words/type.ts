import type { Container, Sprite, Text } from "pixi.js";

export type AvatarItem = {
  name: string;
  url: string;
};

export type DialogueItem = {
  name: string;
  text: string;
};

export type MagicWordsApiResponse = {
  avatars?: AvatarItem[];
  dialogue?: DialogueItem[];
};

export type AvatarSlot = {
  container: Container;
  bubble: Sprite;
  avatar: Sprite;
  dialogueText: Text;
  side: "left" | "right";
};