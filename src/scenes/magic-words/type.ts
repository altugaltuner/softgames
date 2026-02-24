import type {
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from "pixi.js";
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

export type ShowNextDialogueOptions = {
  onPlaybackComplete?: () => void;
};

export type MagicWordsControlsOptions = {
  nextButton: Container;
  nextButtonBg: Graphics;
  nextButtonText: Text;
  playPauseButton: Container;
  playPauseButtonBg: Graphics;
  playIcon: Sprite;
  pauseIcon: Sprite;
  hasDialogues: () => boolean;
  onShowNextDialogue: (options?: ShowNextDialogueOptions) => boolean;
  onResetDialogueIndex: () => void;
};

export type PlayDialogueOptions = {
  onComplete?: () => void;
};

export type MagicWordsDialogueAudioController = {
  stopActive: () => void;
  play: (dialogueIndex: number, options?: PlayDialogueOptions) => boolean;
};

export type MagicWordsDialogueFlowOptions = {
  slots: Record<SpeakerName, AvatarSlot>;
  dialogueAudio: MagicWordsDialogueAudioController;
};

export type MagicWordsLayoutOptions = {
  backgroundFill: Graphics;
  backgroundPattern: Sprite;
  slots: Record<SpeakerName, AvatarSlot>;
  headerText: Text;
  controlsContainer: Container;
  nextButton: Container;
  playPauseButton: Container;
  isLoaded: () => boolean;
  onResetDialogueTransform: (slot: AvatarSlot) => void;
  onApplyFocusScale: (animate: boolean) => void;
};

export type MagicWordsDialogueProgressPayload = {
  index: number;
  position: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  dialogue: DialogueItem;
};

export type MagicWordsEventMap = {
  "dialogue:progress": MagicWordsDialogueProgressPayload;
};

export type Listener<T> = (payload: T) => void;
