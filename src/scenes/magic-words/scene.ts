import { Application, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import type { ManagedScene, ResizePayload } from "../../types/App";
import type { AvatarSlot, DialogueItem } from "./type";
import { MagicWordsSceneConfig } from "./config";
import {
  getAvatarTextureByName,
  getBubbleTexture,
  getMagicWordsDialogue,
  preloadMagicWordsCache,
} from "./cache";

export class MagicWordsScene implements ManagedScene {
  private readonly app: Application;
  private readonly root = new Container();
  private readonly slots: Record<string, AvatarSlot>;
  private readonly nextButton = new Container();
  private readonly nextButtonBg = new Graphics();
  private readonly nextButtonText = new Text({
    text: MagicWordsSceneConfig.button.text,
    style: MagicWordsSceneConfig.button.textStyle,
  });
  private dialogues: DialogueItem[] = [];
  private currentDialogueIndex = -1;

  constructor(app: Application) {
    this.app = app;
    this.root.label = MagicWordsSceneConfig.labels.root;

    this.slots = {
      Sheldon: this.createAvatarSlot(
        "SheldonContainer",
        "SheldonSprite",
        MagicWordsSceneConfig.avatar.slots.Sheldon.side,
      ),
      Penny: this.createAvatarSlot(
        "PennyContainer",
        "PennySprite",
        MagicWordsSceneConfig.avatar.slots.Penny.side,
      ),
      Leonard: this.createAvatarSlot(
        "LeonardContainer",
        "LeonardSprite",
        MagicWordsSceneConfig.avatar.slots.Leonard.side,
      ),
    };

    this.root.addChild(
      this.slots.Sheldon.container,
      this.slots.Penny.container,
      this.slots.Leonard.container,
      this.nextButton,
    );
    this.app.stage.addChild(this.root);

    this.setupNextButton();
  }

  init = async (): Promise<ManagedScene> => {
    await preloadMagicWordsCache();
    await this.applyTextures();
    this.dialogues = await getMagicWordsDialogue();
    this.hideAllDialogues();
    return this;
  };

  resize = ({ width, height }: ResizePayload): void => {
    const avatarSize = Math.max(
      MagicWordsSceneConfig.avatar.minSize,
      Math.min(width, height) * MagicWordsSceneConfig.avatar.sizeRatioToViewport,
    );

    this.positionSlot(
      this.slots.Sheldon,
      width * MagicWordsSceneConfig.avatar.slots.Sheldon.xRatio,
      height * MagicWordsSceneConfig.avatar.slots.Sheldon.yRatio,
      avatarSize,
    );
    this.positionSlot(
      this.slots.Penny,
      width * MagicWordsSceneConfig.avatar.slots.Penny.xRatio,
      height * MagicWordsSceneConfig.avatar.slots.Penny.yRatio,
      avatarSize,
    );
    this.positionSlot(
      this.slots.Leonard,
      width * MagicWordsSceneConfig.avatar.slots.Leonard.xRatio,
      height * MagicWordsSceneConfig.avatar.slots.Leonard.yRatio,
      avatarSize,
    );

    this.nextButton.position.set(
      width * 0.5,
      height - MagicWordsSceneConfig.button.bottomOffset,
    );
  };

  destroy = (): void => {
    this.nextButton.off("pointertap", this.showNextDialogue);
    this.root.destroy({ children: true });
  };

  private createAvatarSlot(
    containerLabel: string,
    avatarLabel: string,
    side: "left" | "right",
  ): AvatarSlot {
    const container = new Container();
    container.label = containerLabel;
    const dialogueContainer = new Container();
    dialogueContainer.label = `${avatarLabel}DialogueContainer`;

    const bubble = new Sprite(Texture.WHITE);
    bubble.label = `${avatarLabel}Bubble`;
    bubble.anchor.set(0.5);
    bubble.visible = false;

    const avatar = new Sprite(Texture.WHITE);
    avatar.label = avatarLabel;
    avatar.anchor.set(0.5);
    avatar.width = MagicWordsSceneConfig.avatar.minSize;
    avatar.height = MagicWordsSceneConfig.avatar.minSize;
    avatar.visible = false;

    const dialogueText = new Text({
      text: "",
      style: MagicWordsSceneConfig.dialogue.textStyle,
      resolution: MagicWordsSceneConfig.dialogue.resolution,
    });
    dialogueText.anchor.set(0.5);
    dialogueText.visible = false;

    dialogueContainer.addChild(bubble, dialogueText);
    container.addChild(dialogueContainer, avatar);
    return { container, bubble, avatar, dialogueText, side };
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
    const slotScale = avatarSize / MagicWordsSceneConfig.avatar.minSize;
    slot.container.scale.set(slotScale);

    if (slot.side === "left") {
      slot.bubble.position.set(
        MagicWordsSceneConfig.bubble.left.x,
        MagicWordsSceneConfig.bubble.left.y,
      );
      slot.bubble.scale.set(
        MagicWordsSceneConfig.bubble.left.scaleX,
        MagicWordsSceneConfig.bubble.left.scaleY,
      );
      slot.dialogueText.position.set(
        MagicWordsSceneConfig.bubble.left.x,
        MagicWordsSceneConfig.bubble.left.textY,
      );
    } else {
      slot.bubble.position.set(
        MagicWordsSceneConfig.bubble.right.x,
        MagicWordsSceneConfig.bubble.right.y,
      );
      slot.bubble.scale.set(
        MagicWordsSceneConfig.bubble.right.scaleX,
        MagicWordsSceneConfig.bubble.right.scaleY,
      );
      slot.dialogueText.position.set(
        MagicWordsSceneConfig.bubble.right.x,
        MagicWordsSceneConfig.bubble.right.textY,
      );
    }
  }

  private hideAllDialogues(): void {
    for (const slot of Object.values(this.slots)) {
      slot.bubble.visible = false;
      slot.dialogueText.visible = false;
      slot.dialogueText.text = "";
    }
  }

  private showNextDialogue = (): void => {
    if (this.dialogues.length === 0) {
      return;
    }

    this.hideAllDialogues();
    this.currentDialogueIndex = (this.currentDialogueIndex + 1) % this.dialogues.length;
    const dialogue = this.dialogues[this.currentDialogueIndex];

    const slot =
      this.slots[dialogue.name] ??
      this.slots[MagicWordsSceneConfig.dialogue.fallbackSpeaker];
    slot.bubble.visible = true;
    slot.dialogueText.text = dialogue.text;
    slot.dialogueText.visible = true;
  };

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