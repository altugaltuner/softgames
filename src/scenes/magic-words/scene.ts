import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import { gsap } from "gsap";
import type { ManagedScene, ResizePayload } from "../../app/type";
import type { AvatarSlot, DialogueItem } from "./type";
import { MagicWordsSceneConfig } from "./config";
import {
  getAvatarTextureByName,
  getBubbleTexture,
  getEmojiTextureByName,
  getMagicWordsDialogue,
  preloadMagicWordsCache,
} from "./cache";
import { renderInlineDialog } from "./dialog-renderer";
import { MagicWordsDialogueAudio } from "./dialogue-audio";
import { magicWordsEvents } from "./events";
import { MagicWordsLoadingSkeleton } from "./loading-skeleton";
import type { SpeakerName } from "./type";

export class MagicWordsScene implements ManagedScene {

  private readonly app: Application;
  private readonly root = new Container();
  private readonly backgroundLayer = new Container();
  private readonly backgroundFill = new Graphics();
  private readonly backgroundPattern = new Sprite(Texture.EMPTY);
  private readonly slots: Record<SpeakerName, AvatarSlot>;
  private readonly controlsContainer = new Container();

  private readonly headerText = new Text({
    text: MagicWordsSceneConfig.header.text,
    style: MagicWordsSceneConfig.header.textStyle,
    resolution: MagicWordsSceneConfig.header.resolution,
  });

  private readonly nextButton = new Container();
  private readonly nextButtonBg = new Graphics();

  private readonly nextButtonText = new Text({
    text: MagicWordsSceneConfig.button.text,
    style: MagicWordsSceneConfig.button.textStyle,
    resolution: MagicWordsSceneConfig.button.resolution,
  });

  private readonly playPauseButton = new Container();
  private readonly playPauseButtonBg = new Graphics();
  private readonly playIcon = new Sprite(Texture.EMPTY);
  private readonly pauseIcon = new Sprite(Texture.EMPTY);
  private readonly loadingSkeleton: MagicWordsLoadingSkeleton;
  private isLoaded = false;
  private isAutoPlaying = false;
  private hasAutoPlayStarted = false;
  private autoPlayTimerId: number | null = null;
  private dialogues: DialogueItem[] = [];
  private currentDialogueIndex = -1;
  private activeSpeaker: SpeakerName | null = null;
  private readonly dialogueAudio = new MagicWordsDialogueAudio();
  private removeDialogueProgressLogger: (() => void) | null = null;

  constructor(app: Application) {
    this.app = app;
    this.root.label = MagicWordsSceneConfig.labels.root;
    this.backgroundLayer.label = "ChatBackground";
    this.backgroundPattern.alpha = 0.06;
    this.backgroundLayer.addChild(this.backgroundFill, this.backgroundPattern);

    this.slots = {
      Sheldon: this.createAvatarSlot(
        "SheldonContainer",
        "SheldonSprite",
        "Sheldon",
        MagicWordsSceneConfig.avatar.slots.Sheldon.side,
      ),
      Penny: this.createAvatarSlot(
        "PennyContainer",
        "PennySprite",
        "Penny",
        MagicWordsSceneConfig.avatar.slots.Penny.side,
      ),
      Leonard: this.createAvatarSlot(
        "LeonardContainer",
        "LeonardSprite",
        "Leonard",
        MagicWordsSceneConfig.avatar.slots.Leonard.side,
      ),
    };

    this.loadingSkeleton = new MagicWordsLoadingSkeleton(
      Object.keys(this.slots).length,
    );
    this.root.addChild(this.backgroundLayer, this.loadingSkeleton.layer);
    this.controlsContainer.addChild(this.nextButton, this.playPauseButton);
    this.root.addChild(
      this.headerText,
      this.slots.Sheldon.container,
      this.slots.Penny.container,
      this.slots.Leonard.container,
      this.controlsContainer,
    );
    this.controlsContainer.visible = false;
    for (const slot of Object.values(this.slots)) {
      slot.container.visible = false;
    }
    this.app.stage.addChild(this.root);

    this.setupNextButton();
    this.setupPlayPauseButton();
  }

  init = async (): Promise<ManagedScene> => {
    await this.loadBackgroundPattern();
    await preloadMagicWordsCache();
    await this.loadControlIcons();
    await this.applyTextures();
    this.dialogues = await getMagicWordsDialogue();
    this.dialogueAudio.setup(this.dialogues);
    this.setupDialogueProgressLogger();
    this.hideAllDialogues();
    this.loadingSkeleton.setVisible(false);
    this.controlsContainer.visible = true;
    for (const slot of Object.values(this.slots)) {
      slot.container.visible = true;
    }
    this.isLoaded = true;
    return this;
  };

  resize = ({ width, height }: ResizePayload): void => {
    this.backgroundFill.clear();
    this.backgroundFill
      .rect(0, 0, width, height)
      .fill({ color: 0x1b1c21 });
    this.backgroundPattern.anchor.set(0.5);
    this.backgroundPattern.position.set(width * 0.5, height * 0.5);
    const textureWidth = this.backgroundPattern.texture.width;
    const textureHeight = this.backgroundPattern.texture.height;
    if (textureWidth > 0 && textureHeight > 0) {
      const coverScale = Math.max(width / textureWidth, height / textureHeight);
      this.backgroundPattern.scale.set(coverScale, coverScale);
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
      const slot = this.slots[name];
      const cfg = MagicWordsSceneConfig.avatar.slots[name];
      const pos = cfg[orientation];
      const x = width * pos.xRatio;
      const y = height * pos.yRatio;
      this.positionSlot(slot, x, y, avatarSize);
      this.loadingSkeleton.updateAvatarPlaceholder(i, x, y, avatarSize);
    }
    if (this.isLoaded) {
      this.applyFocusScale(false);
    }

    const nextWidth = MagicWordsSceneConfig.button.width;
    const playPauseSize = MagicWordsSceneConfig.button.height;
    const totalWidth =
      nextWidth + MagicWordsSceneConfig.interaction.controlsGap + playPauseSize;
    const nextCenterX = -totalWidth * 0.5 + nextWidth * 0.5;
    const playPauseCenterX = totalWidth * 0.5 - playPauseSize * 0.5;

    const controlsX = width * 0.5;
    const controlsY = height - MagicWordsSceneConfig.button.bottomOffset;
    this.headerText.anchor.set(0.5);
    this.headerText.position.set(width * 0.5, MagicWordsSceneConfig.header.topOffset);
    this.controlsContainer.position.set(controlsX, controlsY);
    this.nextButton.position.set(nextCenterX, 0);
    this.playPauseButton.position.set(playPauseCenterX, 0);
    this.loadingSkeleton.updateControlPlaceholders(
      controlsX,
      controlsY,
      nextCenterX,
      playPauseCenterX,
    );
  };

  destroy = (): void => {
    this.nextButton.off("pointertap", this.onNextButtonTap);
    this.playPauseButton.off("pointertap", this.togglePlayPause);
    this.stopAutoPlay();
    this.dialogueAudio.destroy();
    this.removeDialogueProgressLogger?.();
    this.removeDialogueProgressLogger = null;
    for (const slot of Object.values(this.slots)) {
      gsap.killTweensOf(slot.container.scale);
    }
    this.root.destroy({ children: true });
  };

  private setupDialogueProgressLogger(): void {
    if (this.removeDialogueProgressLogger) {
      return;
    }
  }

  private createAvatarSlot(
    containerLabel: string,
    avatarLabel: string,
    displayName: string,
    side: "left" | "right",
  ): AvatarSlot {
    const container = new Container();
    container.label = containerLabel;
    const dialogueContainer = new Container();
    dialogueContainer.label = `${avatarLabel}DialogueContainer`;
    const dialogueContent = new Container();
    dialogueContent.label = `${avatarLabel}DialogueContent`;
    dialogueContent.visible = false;

    const bubble = new Sprite(Texture.WHITE);
    bubble.label = `${avatarLabel}Bubble`;
    bubble.anchor.set(0.5);
    bubble.position.set(0, 0);
    bubble.visible = false;

    const avatar = new Sprite(Texture.WHITE);
    avatar.label = avatarLabel;
    avatar.anchor.set(0.5);
    avatar.width = MagicWordsSceneConfig.avatar.minSize;
    avatar.height = MagicWordsSceneConfig.avatar.minSize;
    avatar.visible = false;

    const nameText = new Text({
      text: displayName,
      style: MagicWordsSceneConfig.avatar.nameTextStyle,
    });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(0, MagicWordsSceneConfig.avatar.nameOffsetY);
    nameText.resolution = MagicWordsSceneConfig.dialogue.resolution;

    dialogueContainer.addChild(bubble, dialogueContent);
    container.addChild(dialogueContainer, avatar, nameText);
    return {
      container,
      dialogueContainer,
      dialogueContent,
      bubble,
      avatar,
      nameText,
      baseScale: 1,
      side,
    };
  }

  private setupNextButton(): void {
    this.nextButton.label = MagicWordsSceneConfig.labels.nextButton;
    this.nextButton.eventMode = "static";
    this.nextButton.cursor = "pointer";
    this.nextButton.pivot.set(
      MagicWordsSceneConfig.button.width * 0.5,
      MagicWordsSceneConfig.button.height * 0.5,
    );

    this.nextButtonBg
      .roundRect(
        0,
        0,
        MagicWordsSceneConfig.button.width,
        MagicWordsSceneConfig.button.height,
        MagicWordsSceneConfig.button.radius,
      )
      .fill({ color: MagicWordsSceneConfig.button.fillColor })
      .stroke({
        color: MagicWordsSceneConfig.button.strokeColor,
        width: MagicWordsSceneConfig.button.strokeWidth,
        alpha: MagicWordsSceneConfig.button.strokeAlpha,
      });

    this.nextButtonText.anchor.set(0.5);
    this.nextButtonText.position.set(
      MagicWordsSceneConfig.button.width * 0.5,
      MagicWordsSceneConfig.button.height * 0.5,
    );

    this.nextButton.addChild(this.nextButtonBg, this.nextButtonText);
    this.nextButton.on("pointertap", this.onNextButtonTap);
    this.setupButtonInteractions(
      this.nextButton,
      this.nextButtonBg,
      MagicWordsSceneConfig.button.width,
      MagicWordsSceneConfig.button.height,
      MagicWordsSceneConfig.button.fillColor,
      MagicWordsSceneConfig.interaction.nextButton.hoverFillColor,
      MagicWordsSceneConfig.interaction.nextButton.pressedFillColor,
    );
  }

  private setupPlayPauseButton(): void {
    const size = MagicWordsSceneConfig.button.height;
    this.playPauseButton.label = "PlayPauseButton";
    this.playPauseButton.eventMode = "static";
    this.playPauseButton.cursor = "pointer";
    this.playPauseButton.pivot.set(size * 0.5, size * 0.5);

    this.playPauseButtonBg
      .roundRect(0, 0, size, size, MagicWordsSceneConfig.button.radius)
      .fill({ color: 0xffffff })
      .stroke({
        color: MagicWordsSceneConfig.button.strokeColor,
        width: MagicWordsSceneConfig.button.strokeWidth,
        alpha: MagicWordsSceneConfig.button.strokeAlpha,
      });

    this.playIcon.anchor.set(0.5);
    this.playIcon.position.set(size * 0.5, size * 0.5);
    this.playIcon.width = 22;
    this.playIcon.height = 22;
    this.playIcon.tint = 0xffffff;

    this.pauseIcon.anchor.set(0.5);
    this.pauseIcon.position.set(size * 0.5, size * 0.5);
    this.pauseIcon.width = 22;
    this.pauseIcon.height = 22;
    this.pauseIcon.tint = 0xffffff;
    this.pauseIcon.visible = false;

    this.playPauseButton.addChild(
      this.playPauseButtonBg,
      this.playIcon,
      this.pauseIcon,
    );
    this.playPauseButton.on("pointertap", this.togglePlayPause);
    this.updatePlayPauseIcon();
    this.setupButtonInteractions(
      this.playPauseButton,
      this.playPauseButtonBg,
      size,
      size,
      MagicWordsSceneConfig.interaction.playPauseButton.normalFillColor,
      MagicWordsSceneConfig.interaction.playPauseButton.hoverFillColor,
      MagicWordsSceneConfig.interaction.playPauseButton.pressedFillColor,
    );
  }

  private setupButtonInteractions(
    button: Container,
    background: Graphics,
    width: number,
    height: number,
    normalColor: number,
    hoverColor: number,
    pressedColor: number,
  ): void {
    button.on("pointerover", () => {
      this.drawButtonBackground(background, width, height, hoverColor);
      gsap.to(button.position, {
        y: MagicWordsSceneConfig.interaction.buttonHoverOffset,
        duration: MagicWordsSceneConfig.interaction.buttonAnimDuration,
        ease: "power2.out",
        overwrite: true,
      });
    });

    button.on("pointerout", () => {
      this.drawButtonBackground(background, width, height, normalColor);
      gsap.to(button.position, {
        y: 0,
        duration: MagicWordsSceneConfig.interaction.buttonAnimDuration,
        ease: "power2.out",
        overwrite: true,
      });
    });

    button.on("pointerdown", () => {
      this.drawButtonBackground(background, width, height, pressedColor);
    });

    button.on("pointerup", () => {
      this.drawButtonBackground(background, width, height, hoverColor);
    });

    button.on("pointerupoutside", () => {
      this.drawButtonBackground(background, width, height, normalColor);
      gsap.to(button.position, {
        y: 0,
        duration: MagicWordsSceneConfig.interaction.buttonAnimDuration,
        ease: "power2.out",
        overwrite: true,
      });
    });
  }

  private drawButtonBackground(
    background: Graphics,
    width: number,
    height: number,
    color: number,
  ): void {
    background.clear();
    background
      .roundRect(0, 0, width, height, MagicWordsSceneConfig.button.radius)
      .fill({ color })
      .stroke({
        color: MagicWordsSceneConfig.button.strokeColor,
        width: MagicWordsSceneConfig.button.strokeWidth,
        alpha: MagicWordsSceneConfig.button.strokeAlpha,
      });
  }

  private async loadControlIcons(): Promise<void> {
    const [playTexture, pauseTexture] = await Promise.all([
      Assets.load<Texture>("/play.svg"),
      Assets.load<Texture>("/pause.svg"),
    ]);
    this.playIcon.texture = playTexture;
    this.pauseIcon.texture = pauseTexture;
  }

  private async loadBackgroundPattern(): Promise<void> {
    try {
      this.backgroundPattern.texture = await Assets.load<Texture>(
        "/assets/ui/chat-bg.webp",
      );
    } catch {
      this.backgroundPattern.texture = Texture.EMPTY;
    }
  }

  private togglePlayPause = (): void => {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
      return;
    }

    this.startAutoPlay();
  };

  private onNextButtonTap = (): void => {
    this.showNextDialogue();
    if (this.isAutoPlaying) {
      this.scheduleNextAutoPlay();
    }
  };

  private startAutoPlay(): void {
    if (this.dialogues.length === 0) {
      return;
    }

    if (!this.hasAutoPlayStarted) {
      this.currentDialogueIndex = -1;
      this.hasAutoPlayStarted = true;
    }

    this.isAutoPlaying = true;
    this.updatePlayPauseIcon();
    this.showNextDialogue();
    this.scheduleNextAutoPlay();
  }

  private stopAutoPlay(): void {
    this.isAutoPlaying = false;
    this.updatePlayPauseIcon();
    if (this.autoPlayTimerId !== null) {
      window.clearTimeout(this.autoPlayTimerId);
      this.autoPlayTimerId = null;
    }
  }

  private scheduleNextAutoPlay(): void {
    if (this.autoPlayTimerId !== null) {
      window.clearTimeout(this.autoPlayTimerId);
    }

    if (!this.isAutoPlaying) {
      this.autoPlayTimerId = null;
      return;
    }

    this.autoPlayTimerId = window.setTimeout(() => {
      if (!this.isAutoPlaying) {
        return;
      }
      this.showNextDialogue();
      this.scheduleNextAutoPlay();
    }, MagicWordsSceneConfig.interaction.autoPlayIntervalMs);
  }

  private updatePlayPauseIcon(): void {
    this.playIcon.visible = !this.isAutoPlaying;
    this.pauseIcon.visible = this.isAutoPlaying;
  }

  private positionSlot(slot: AvatarSlot, x: number, y: number, avatarSize: number): void {
    slot.container.position.set(x, y);
    slot.baseScale = avatarSize / MagicWordsSceneConfig.avatar.minSize;
    slot.nameText.position.set(0, MagicWordsSceneConfig.avatar.nameOffsetY);
    this.resetDialogueTransform(slot);

    if (slot.side === "left") {
      slot.bubble.scale.set(
        MagicWordsSceneConfig.bubble.left.scaleX,
        MagicWordsSceneConfig.bubble.left.scaleY,
      );
      slot.dialogueContent.position.set(0, MagicWordsSceneConfig.bubble.left.textY - MagicWordsSceneConfig.bubble.left.y);
    } else {
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

  private hideAllDialogues(): void {
    for (const slot of Object.values(this.slots)) {
      slot.bubble.visible = false;
      slot.dialogueContent.visible = false;
      slot.dialogueContent.removeChildren().forEach((child) => child.destroy());
      this.resetDialogueTransform(slot);
    }
  }

  private showNextDialogue = (): void => {
    if (this.dialogues.length === 0) {
      return;
    }

    this.dialogueAudio.stopActive();
    this.hideAllDialogues();
    this.currentDialogueIndex = (this.currentDialogueIndex + 1) % this.dialogues.length;
    const dialogue = this.dialogues[this.currentDialogueIndex];
    magicWordsEvents.emit("dialogue:progress", {
      index: this.currentDialogueIndex,
      position: this.currentDialogueIndex + 1,
      total: this.dialogues.length,
      isFirst: this.currentDialogueIndex === 0,
      isLast: this.currentDialogueIndex === this.dialogues.length - 1,
      dialogue,
    });

    const speakerName = (dialogue.name in this.slots
      ? dialogue.name
      : MagicWordsSceneConfig.dialogue.fallbackSpeaker) as SpeakerName;
    const slot = this.slots[speakerName];
    this.activeSpeaker = speakerName;
    this.applyFocusScale(true);
    slot.bubble.visible = true;
    const inlineContent = renderInlineDialog(dialogue.text, getEmojiTextureByName, {
      textStyle: MagicWordsSceneConfig.dialogue.textStyle,
      resolution: MagicWordsSceneConfig.dialogue.resolution,
      maxWidth: MagicWordsSceneConfig.dialogue.textStyle.wordWrapWidth,
      emojiSize: Math.max(12, MagicWordsSceneConfig.dialogue.textStyle.fontSize * 1.25),
    });
    slot.dialogueContent.removeChildren().forEach((child) => child.destroy());
    slot.dialogueContent.addChild(inlineContent);
    slot.dialogueContent.visible = true;
    this.animateDialogueIn(slot);
    this.dialogueAudio.play(this.currentDialogueIndex);
  };

  private resetDialogueTransform(slot: AvatarSlot): void {
    const base = this.getDialogueBasePosition(slot.side);
    gsap.killTweensOf(slot.dialogueContainer.scale);
    slot.dialogueContainer.pivot.set(0, 0);
    slot.dialogueContainer.position.set(base.x, base.y);
    slot.dialogueContainer.scale.set(1, 1);
  }

  private animateDialogueIn(slot: AvatarSlot): void {
    const base = this.getDialogueBasePosition(slot.side);
    const bounds = slot.dialogueContainer.getLocalBounds();
    const pivotX = slot.side === "left" ? bounds.x : bounds.x + bounds.width;
    const pivotY = bounds.y + bounds.height;

    slot.dialogueContainer.pivot.set(pivotX, pivotY);
    slot.dialogueContainer.position.set(base.x + pivotX, base.y + pivotY);

    gsap.killTweensOf(slot.dialogueContainer.scale);
    slot.dialogueContainer.scale.set(0.15, 0.15);
    gsap.to(slot.dialogueContainer.scale, {
      x: 1,
      y: 1,
      duration: 0.2,
      ease: "power2.out",
      overwrite: true,
    });
  }

  private getDialogueBasePosition(side: "left" | "right"): { x: number; y: number } {
    if (side === "left") {
      return {
        x: MagicWordsSceneConfig.bubble.left.x,
        y: MagicWordsSceneConfig.bubble.left.y,
      };
    }
    return {
      x: MagicWordsSceneConfig.bubble.right.x,
      y: MagicWordsSceneConfig.bubble.right.y,
    };
  }

  private applyFocusScale(animate: boolean): void {
    for (const [name, slot] of Object.entries(this.slots)) {
      const isActive = this.activeSpeaker === (name as SpeakerName);
      const targetScale =
        slot.baseScale * (isActive ? MagicWordsSceneConfig.avatar.focusScale : 1);

      if (!animate) {
        gsap.killTweensOf(slot.container.scale);
        slot.container.scale.set(targetScale);
        continue;
      }

      gsap.to(slot.container.scale, {
        x: targetScale,
        y: targetScale,
        duration: MagicWordsSceneConfig.avatar.focusDuration,
        ease: "power2.out",
        overwrite: true,
      });
    }
  }

  private async applyTextures(): Promise<void> {
    const bubbleTexture = getBubbleTexture();
    if (bubbleTexture) {
      for (const slot of Object.values(this.slots)) {
        slot.bubble.texture = bubbleTexture;
      }
    }

    for (const [name, slot] of Object.entries(this.slots)) {
      const avatarTexture = await getAvatarTextureByName(name);
      if (!avatarTexture) {
        continue;
      }
      slot.avatar.texture = avatarTexture;
      slot.avatar.visible = true;
    }
  }
}