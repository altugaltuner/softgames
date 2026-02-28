import { Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";
import type {
  DialogueSegment,
  EmojiTextureLookup,
  InlineDialogRenderOptions,
} from "./type";
import { MagicWordsSceneConfig } from "./config";

const TOKEN_REGEX = /\{([^{}]+)\}/g;

export function renderInlineDialog(
  dialogText: string,
  getEmojiTexture: EmojiTextureLookup,
  options: InlineDialogRenderOptions,
): Container {
  const {
    textStyle,
    resolution,
    maxWidth = Number.POSITIVE_INFINITY,
    emojiSize = MagicWordsSceneConfig.button.emojiSize,
    lineHeight,
    fallbackEmojiName = MagicWordsSceneConfig.button.fallBackEmojiName,
  } = options;

  const root = new Container();
  const style = toNoWrapStyle(textStyle);
  // Probe text is reused for width/spacing metrics to keep wrapping deterministic.
  const measurementText = new Text({ text: "Xg|", style, resolution });
  const rowHeight = lineHeight ?? Math.max(measurementText.height, emojiSize);
  const inlineSpaceWidth = measure(measurementText, "x x") - measure(measurementText, "xx");

  let cursorX = 0;
  let cursorY = 0;

  const wrap = () => { cursorX = 0; cursorY += rowHeight; };
  const centerY = (height: number) => cursorY + Math.max(0, (rowHeight - height) * 0.5);
  const canPlaceInline = () => cursorX > 0;
  const placeInlineSpacing = () => {
    if (canPlaceInline()) {
      cursorX += inlineSpaceWidth;
    }
  };

  for (const segment of tokenize(dialogText)) {
    if (segment.kind === "emoji") {
      const emojiTexture = getEmojiTexture(segment.name) ?? getEmojiTexture(fallbackEmojiName);
      if (!emojiTexture) {
        continue;
      }

      placeInlineSpacing();
      if (cursorX + emojiSize > maxWidth) {
        wrap();
      }

      const emojiSprite = new Sprite(emojiTexture);
      emojiSprite.width = emojiSize;
      emojiSprite.height = emojiSize;
      emojiSprite.position.set(cursorX, centerY(emojiSize));
      emojiSprite.roundPixels = true;
      // Mask keeps emoji corners visually consistent with the dialogue style.
      const mask = new Graphics()
        .roundRect(0, 0, emojiSize, emojiSize, emojiSize * MagicWordsSceneConfig.button.emojiCornerRadiusRatio)
        .fill(0xffffff);
      mask.position.copyFrom(emojiSprite.position);
      emojiSprite.mask = mask;
      root.addChild(emojiSprite, mask);
      cursorX += emojiSize;
      continue;
    }

    const textWords = segment.value.split(/\s+/).filter(Boolean);
    let bufferedWords: string[] = [];

    const renderBufferedWords = () => {
      if (!bufferedWords.length) return;
      const node = new Text({ text: bufferedWords.join(" "), style, resolution });
      node.position.set(cursorX, centerY(node.height));
      node.roundPixels = true;
      root.addChild(node);
      cursorX += node.width;
      bufferedWords = [];
    };

    for (const word of textWords) {
      const candidateText = bufferedWords.length ? [...bufferedWords, word].join(" ") : word;
      const candidateWidth = measure(measurementText, candidateText);
      const candidateStartX = canPlaceInline() && !bufferedWords.length ? cursorX + inlineSpaceWidth : cursorX;
      // Wrap only when current buffered chunk would overflow.
      if (candidateStartX + candidateWidth > maxWidth && bufferedWords.length) {
        renderBufferedWords();
        wrap();
      }
      if (canPlaceInline() && !bufferedWords.length) {
        placeInlineSpacing();
      }

      bufferedWords.push(word);
    }

    renderBufferedWords();
  }

  const bounds = root.getLocalBounds();
  // Center pivot simplifies placing this container inside bubble content slots.
  root.pivot.set(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
  measurementText.destroy();
  return root;
}

function toNoWrapStyle(input: TextStyle | ConstructorParameters<typeof TextStyle>[0]): TextStyle {
  const style = input instanceof TextStyle ? input.clone() : new TextStyle(input);
  style.wordWrap = false;
  return style;
}

function measure(node: Text, value: string): number {
  node.text = value;
  return node.width;
}

function tokenize(input: string): DialogueSegment[] {
  const result: DialogueSegment[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(input)) !== null) {
    if (match.index > cursor) {
      result.push({ kind: "text", value: input.slice(cursor, match.index) });
    }
    result.push({ kind: "emoji", name: match[1].trim() });
    cursor = TOKEN_REGEX.lastIndex;
  }

  if (cursor < input.length) {
    result.push({ kind: "text", value: input.slice(cursor) });
  }

  return result.length ? result : [{ kind: "text", value: input }];
}
