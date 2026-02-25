import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import type { ManagedScene, ResizePayload } from "../../app/type";
import type { AvatarSlot } from "./type";
import { MagicWordsSceneConfig } from "./config";
import {
  getAvatarTextureByName,
  getBubbleTexture,
  getMagicWordsDialogue,
  preloadMagicWordsCache,
} from "./cache";
import { DialogueAudio } from "./dialogueAudio";
import { MagicWordsControls } from "./controls";
import { MagicWordsDialogueFlow } from "./dialogueFlow";
import { MagicWordsLayout } from "./layout";
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
  private readonly controls: MagicWordsControls;
  private readonly dialogueFlow: MagicWordsDialogueFlow;
  private readonly layout: MagicWordsLayout;
  private isLoaded = false;
  private readonly dialogueAudio = new DialogueAudio();

  constructor(app: Application) {
    this.app = app;
    this.root.label = MagicWordsSceneConfig.labels.root;
    this.root.visible = false;
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

    this.root.addChild(this.backgroundLayer);
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

    this.dialogueFlow = new MagicWordsDialogueFlow({
      slots: this.slots,
      dialogueAudio: this.dialogueAudio,
    });
    this.layout = new MagicWordsLayout({
      backgroundFill: this.backgroundFill,
      backgroundPattern: this.backgroundPattern,
      slots: this.slots,
      headerText: this.headerText,
      controlsContainer: this.controlsContainer,
      nextButton: this.nextButton,
      playPauseButton: this.playPauseButton,
      isLoaded: () => this.isLoaded,
      onResetDialogueTransform: (slot) => this.dialogueFlow.resetDialogueTransform(slot),
      onApplyFocusScale: (animate) => this.dialogueFlow.applyFocusScale(animate),
    });
    this.controls = new MagicWordsControls({
      nextButton: this.nextButton,
      nextButtonBg: this.nextButtonBg,
      nextButtonText: this.nextButtonText,
      playPauseButton: this.playPauseButton,
      playPauseButtonBg: this.playPauseButtonBg,
      playIcon: this.playIcon,
      pauseIcon: this.pauseIcon,
      hasDialogues: () => this.dialogueFlow.hasDialogues(),
      onShowNextDialogue: this.dialogueFlow.showNextDialogue,
      onResetDialogueIndex: () => this.dialogueFlow.resetIndex(),
    });
    this.controls.setup();
  }

  init = async (): Promise<ManagedScene> => {
    // Preload all assets in order: static visuals, cache preload, controls, then dialogue data.
    await this.loadBackgroundPattern();
    await preloadMagicWordsCache();
    await this.loadControlIcons();
    await this.applyTextures();
    const dialogues = await getMagicWordsDialogue();
    this.dialogueFlow.setDialogues(dialogues);
    this.dialogueAudio.setup(dialogues);
    this.dialogueFlow.hideAllDialogues();
    // Reveal controls/avatars only after assets and dialogue state are ready.
    this.controlsContainer.visible = true;
    for (const slot of Object.values(this.slots)) {
      slot.container.visible = true;
    }
    this.isLoaded = true;
    return this;
  };

  resize = (payload: ResizePayload): void => {
    this.layout.resize(payload);
    if (!this.root.visible) {
      // Scene becomes visible on first resize so initial placement is already correct.
      this.root.visible = true;
    }
  };

  destroy = (): void => {
    this.controls.destroy();
    this.dialogueAudio.destroy();
    this.dialogueFlow.destroy();
    this.root.destroy({ children: true });
  };

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

  private async applyTextures(): Promise<void> {
    const bubbleTexture = getBubbleTexture();
    if (bubbleTexture) {
      for (const slot of Object.values(this.slots)) {
        slot.bubble.texture = bubbleTexture;
      }
    }

    // Avatar textures are loaded per slot and skipped gracefully if unavailable.
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