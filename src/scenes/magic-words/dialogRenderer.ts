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
    fallbackEmojiName = "satisfied",
  } = options;

  const root = new Container();
  const style = toNoWrapStyle(textStyle);
  // Probe text is reused for width/spacing metrics to keep wrapping deterministic.
  const probe = new Text({ text: "Xg|", style, resolution });
  const rowH = lineHeight ?? Math.max(probe.height, emojiSize);
  const spaceW = measure(probe, "x x") - measure(probe, "xx");

  let cx = 0;
  let cy = 0;

  const wrap = () => { cx = 0; cy += rowH; };
  const centerY = (h: number) => cy + Math.max(0, (rowH - h) * 0.5);

  for (const seg of tokenize(dialogText)) {
    if (seg.kind === "emoji") {
      const tex = getEmojiTexture(seg.name) ?? getEmojiTexture(fallbackEmojiName);
      if (!tex) continue;

      if (cx > 0) cx += spaceW;
      if (cx + emojiSize > maxWidth) wrap();

      const s = new Sprite(tex);
      s.width = emojiSize;
      s.height = emojiSize;
      s.position.set(cx, centerY(emojiSize));
      s.roundPixels = true;
      // Mask keeps emoji corners visually consistent with the dialogue style.
      const mask = new Graphics()
        .roundRect(0, 0, emojiSize, emojiSize, emojiSize * MagicWordsSceneConfig.button.emojiCornerRadiusRatio)
        .fill(0xffffff);
      mask.position.copyFrom(s.position);
      s.mask = mask;
      root.addChild(s);
      root.addChild(mask);
      cx += emojiSize;
      continue;
    }

    const words = seg.value.split(/\s+/).filter(Boolean);
    let buf: string[] = [];

    const flush = () => {
      if (!buf.length) return;
      const node = new Text({ text: buf.join(" "), style, resolution });
      node.position.set(cx, centerY(node.height));
      node.roundPixels = true;
      root.addChild(node);
      cx += node.width;
      buf = [];
    };

    for (const word of words) {
      const candidate = buf.length ? [...buf, word].join(" ") : word;
      const w = measure(probe, candidate);
      const x0 = cx > 0 && !buf.length ? cx + spaceW : cx;

      // Wrap only when current buffered chunk would overflow.
      if (x0 + w > maxWidth && buf.length) { flush(); wrap(); }
      if (cx > 0 && !buf.length) cx += spaceW;

      buf.push(word);
    }

    flush();
  }

  const b = root.getLocalBounds();
  // Center pivot simplifies placing this container inside bubble content slots.
  root.pivot.set(b.x + b.width * 0.5, b.y + b.height * 0.5);
  probe.destroy();
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
