import { BlurFilter, Container, Graphics } from "pixi.js";
import { MagicWordsSceneConfig } from "./config";

const SKELETON_COLOR = 0x696969;
const SKELETON_ALPHA = 0.6;

export class MagicWordsLoadingSkeleton {
  readonly layer = new Container();
  private readonly avatarPlaceholders: Graphics[] = [];
  private readonly nextButtonPlaceholder = new Graphics();
  private readonly playPauseButtonPlaceholder = new Graphics();

  constructor(avatarSlotCount: number) {
    this.layer.label = "SkeletonLayer";
    this.layer.filters = [new BlurFilter({ strength: 2, quality: 10 })];

    for (let i = 0; i < avatarSlotCount; i++) {
      const placeholder = new Graphics();
      this.avatarPlaceholders.push(placeholder);
      this.layer.addChild(placeholder);
    }

    this.nextButtonPlaceholder
      .roundRect(
        0,
        0,
        MagicWordsSceneConfig.button.width,
        MagicWordsSceneConfig.button.height,
        MagicWordsSceneConfig.button.radius,
      )
      .fill({ color: SKELETON_COLOR, alpha: SKELETON_ALPHA });
    this.nextButtonPlaceholder.pivot.set(
      MagicWordsSceneConfig.button.width * 0.5,
      MagicWordsSceneConfig.button.height * 0.5,
    );

    const playPauseSize = MagicWordsSceneConfig.button.height;
    this.playPauseButtonPlaceholder
      .roundRect(
        0,
        0,
        playPauseSize,
        playPauseSize,
        MagicWordsSceneConfig.button.radius,
      )
      .fill({ color: SKELETON_COLOR, alpha: SKELETON_ALPHA });
    this.playPauseButtonPlaceholder.pivot.set(playPauseSize * 0.5, playPauseSize * 0.5);

    this.layer.addChild(this.nextButtonPlaceholder, this.playPauseButtonPlaceholder);
  }

  setVisible(visible: boolean): void {
    this.layer.visible = visible;
  }

  updateAvatarPlaceholder(index: number, x: number, y: number, avatarSize: number): void {
    const placeholder = this.avatarPlaceholders[index];
    if (!placeholder) {
      return;
    }

    placeholder.clear();
    placeholder
      .roundRect(-avatarSize * 0.5, -avatarSize * 0.5, avatarSize, avatarSize, 8)
      .fill({ color: SKELETON_COLOR, alpha: SKELETON_ALPHA });
    placeholder.position.set(x, y);
  }

  updateControlPlaceholders(
    controlsX: number,
    controlsY: number,
    nextCenterX: number,
    playPauseCenterX: number,
  ): void {
    this.nextButtonPlaceholder.position.set(controlsX + nextCenterX, controlsY);
    this.playPauseButtonPlaceholder.position.set(
      controlsX + playPauseCenterX,
      controlsY,
    );
  }
}
