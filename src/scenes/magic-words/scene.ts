import {
  Application,
  BlurFilter,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import { gsap } from "gsap";
import type { ManagedScene, ResizePayload } from "../../types/App";
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
import { magicWordsEvents } from "./events";

const SKELETON_COLOR = 0x696969;
const SKELETON_ALPHA = 0.6;

type SpeakerName = keyof typeof MagicWordsSceneConfig.avatar.slots;

export class MagicWordsScene implements ManagedScene {
  private readonly app: Application;
  private readonly root = new Container();
  private readonly slots: Record<SpeakerName, AvatarSlot>;
  private readonly nextButton = new Container();
  private readonly nextButtonBg = new Graphics();
  private readonly nextButtonText = new Text({
    text: MagicWordsSceneConfig.button.text,
    style: MagicWordsSceneConfig.button.textStyle,
    resolution: MagicWordsSceneConfig.button.resolution,
  });
  private readonly skeletonLayer = new Container();
  private readonly skeletonAvatars: Graphics[] = [];
  private readonly skeletonButton = new Graphics();
  private isLoaded = false;
  private dialogues: DialogueItem[] = [];
  private currentDialogueIndex = -1;
  private activeSpeaker: SpeakerName | null = null;
  private removeDialogueProgressLogger: (() => void) | null = null;

  constructor(app: Application) {
    this.app = app;
    this.root.label = MagicWordsSceneConfig.labels.root;

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

    this.setupSkeletonLayer();
    this.root.addChild(this.skeletonLayer);
    this.root.addChild(
      this.slots.Sheldon.container,
      this.slots.Penny.container,
      this.slots.Leonard.container,
      this.nextButton,
    );
    this.nextButton.visible = false;
    for (const slot of Object.values(this.slots)) {
      slot.container.visible = false;
    }
    this.app.stage.addChild(this.root);

    this.setupNextButton();
  }

  private getAvatarSlotCount(): number {
    return Object.keys(MagicWordsSceneConfig.avatar.slots).length;
  }

  private setupSkeletonLayer(): void {
    this.skeletonLayer.label = "SkeletonLayer";
    this.skeletonLayer.filters = [
      new BlurFilter({ strength: 2, quality: 10 }),
    ];
    const count = this.getAvatarSlotCount();
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      this.skeletonAvatars.push(g);
      this.skeletonLayer.addChild(g);
    }
    this.skeletonButton
      .roundRect(
        0,
        0,
        MagicWordsSceneConfig.button.width,
        MagicWordsSceneConfig.button.height,
        MagicWordsSceneConfig.button.radius,
      )
      .fill({ color: SKELETON_COLOR, alpha: SKELETON_ALPHA });
    this.skeletonButton.pivot.set(
      MagicWordsSceneConfig.button.width * 0.5,
      MagicWordsSceneConfig.button.height * 0.5,
    );
    this.skeletonLayer.addChild(this.skeletonButton);
  }

  init = async (): Promise<ManagedScene> => {
    this.fireResize();
    await preloadMagicWordsCache();
    await this.applyTextures();
    this.dialogues = await getMagicWordsDialogue();
    this.setupDialogueProgressLogger();
    this.hideAllDialogues();
    this.skeletonLayer.visible = false;
    this.nextButton.visible = true;
    for (const slot of Object.values(this.slots)) {
      slot.container.visible = true;
    }
    this.isLoaded = true;
    return this;
  };

  private fireResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(
      width / 640,
      height / 360,
    );
    this.resize({ width, height, scale });
  }

  resize = ({ width, height }: ResizePayload): void => {
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
      const skeleton = this.skeletonAvatars[i];
      if (skeleton) {
        skeleton.clear();
        skeleton
          .roundRect(-avatarSize * 0.5, -avatarSize * 0.5, avatarSize, avatarSize, 8)
          .fill({ color: SKELETON_COLOR, alpha: SKELETON_ALPHA });
        skeleton.position.set(x, y);
      }
    }
    if (this.isLoaded) {
      this.applyFocusScale(false);
    }

    this.nextButton.position.set(
      width * 0.5,
      height - MagicWordsSceneConfig.button.bottomOffset,
    );
    this.skeletonButton.position.set(
      width * 0.5,
      height - MagicWordsSceneConfig.button.bottomOffset,
    );
  };

  destroy = (): void => {
    this.nextButton.off("pointertap", this.showNextDialogue);
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

    this.removeDialogueProgressLogger = magicWordsEvents.on(
      "dialogue:progress",
      (payload) => {
        console.log(
          `[MagicWords] Dialogue ${payload.position}/${payload.total} | ${payload.dialogue.name}: ${payload.dialogue.text}`,
        );
      },
    );
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
    this.nextButton.on("pointertap", this.showNextDialogue);
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