import type { ResizePayload } from "../../app/type";
import { MagicWordsSceneConfig } from "./config";
import type { AvatarSlot, MagicWordsLayoutOptions, SpeakerName } from "./type";

export class MagicWordsLayout {
  private readonly options: MagicWordsLayoutOptions;

  constructor(options: MagicWordsLayoutOptions) {
    this.options = options;
  }

  resize = ({ width, height }: ResizePayload): void => {
    this.options.backgroundFill.clear();
    this.options.backgroundFill
      .rect(0, 0, width, height)
      .fill({ color: 0x1b1c21 });
    this.options.backgroundPattern.anchor.set(0.5);
    this.options.backgroundPattern.position.set(width * 0.5, height * 0.5);
    const textureWidth = this.options.backgroundPattern.texture.width;
    const textureHeight = this.options.backgroundPattern.texture.height;
    if (textureWidth > 0 && textureHeight > 0) {
      const coverScale = Math.max(width / textureWidth, height / textureHeight);
      this.options.backgroundPattern.scale.set(coverScale, coverScale);
    }

    const avatarSize = Math.max(
      MagicWordsSceneConfig.avatar.minSize,
      Math.min(width, height) * MagicWordsSceneConfig.avatar.sizeRatioToViewport,
    );

    const orientation = width >= height ? "landscape" : "portrait";
    const slotNames = Object.keys(
      MagicWordsSceneConfig.avatar.slots,
    ) as SpeakerName[];
    for (let i = 0; i < slotNames.length; i++) {
      const name = slotNames[i];
      const slot = this.options.slots[name];
      const cfg = MagicWordsSceneConfig.avatar.slots[name];
      const pos = cfg[orientation];
      const x = width * pos.xRatio;
      const y = height * pos.yRatio;
      this.positionSlot(slot, x, y, avatarSize);
    }
    if (this.options.isLoaded()) {
      this.options.onApplyFocusScale(false);
    }

    const nextWidth = MagicWordsSceneConfig.button.width;
    const playPauseSize = MagicWordsSceneConfig.button.height;
    const totalWidth =
      nextWidth + MagicWordsSceneConfig.interaction.controlsGap + playPauseSize;
    const nextCenterX = -totalWidth * 0.5 + nextWidth * 0.5;
    const playPauseCenterX = totalWidth * 0.5 - playPauseSize * 0.5;

    const controlsX = width * 0.5;
    const controlsY = height - MagicWordsSceneConfig.button.bottomOffset;
    this.options.headerText.anchor.set(0.5);
    this.options.headerText.position.set(
      width * 0.5,
      MagicWordsSceneConfig.header.topOffset,
    );
    this.options.controlsContainer.position.set(controlsX, controlsY);
    this.options.nextButton.position.set(nextCenterX, 0);
    this.options.playPauseButton.position.set(playPauseCenterX, 0);
  };

  private positionSlot(
    slot: AvatarSlot,
    x: number,
    y: number,
    avatarSize: number,
  ): void {
    slot.container.position.set(x, y);
    slot.baseScale = avatarSize / MagicWordsSceneConfig.avatar.minSize;
    slot.nameText.position.set(0, MagicWordsSceneConfig.avatar.nameOffsetY);
    this.options.onResetDialogueTransform(slot);

    if (slot.side === "left") {
      slot.bubble.scale.set(
        MagicWordsSceneConfig.bubble.left.scaleX,
        MagicWordsSceneConfig.bubble.left.scaleY,
      );
      slot.dialogueContent.position.set(
        0,
        MagicWordsSceneConfig.bubble.left.textY - MagicWordsSceneConfig.bubble.left.y,
      );
      return;
    }

    slot.bubble.scale.set(
      MagicWordsSceneConfig.bubble.right.scaleX,
      MagicWordsSceneConfig.bubble.right.scaleY,
    );
    slot.dialogueContent.position.set(
      0,
      MagicWordsSceneConfig.bubble.right.textY - MagicWordsSceneConfig.bubble.right.y,
    );
  }
}
