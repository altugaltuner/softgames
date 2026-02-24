import { Application, Assets, Container, Graphics, Sprite, Texture, } from "pixi.js";
import cardsData from "../../data/cards.json";
import { AceOfShadowsConfig } from "./config";
import { createLauncher } from "./tween-system/Tween";
import type { AceOfShadowsScene } from "./types";
import type { ResizePayload } from "../../app/type";

const cards = cardsData as string[];
const woodenBackgroundPath = "/assets/ui/wooden-bg.webp";
const cardContainerPath = "/assets/ui/card-container.png";

class AceOfShadowsSceneImpl implements AceOfShadowsScene {
  readonly container = new Container();
  private readonly app: Application;
  private readonly backgroundContainer = new Container();
  private readonly deckContainer = new Container();
  private readonly cardContainer = new Container();
  private readonly background = new Graphics();
  private backgroundSprite: Sprite | null = null;
  private backgroundTexture: Texture | null = null;
  private cardFrameSprite: Sprite | null = null;
  private cardFrameTexture: Texture | null = null;
  private cardLauncher: ReturnType<typeof createLauncher> | null =
    null;

  constructor(app: Application) {
    this.app = app;
    this.container.sortableChildren = true;
    this.container.addChild(this.backgroundContainer, this.deckContainer);
    this.container.label = "AceOfShadowsScene";
    this.backgroundContainer.label = "backgroundContainer";
    this.deckContainer.label = "deckContainer";
    this.cardContainer.label = "cardContainer";
    this.backgroundContainer.addChild(this.background);
  }

  async init(): Promise<AceOfShadowsScene> {
    // Load static scene textures before creating card sprites.
    this.backgroundTexture = await Assets.load<Texture>(woodenBackgroundPath);
    this.backgroundSprite = new Sprite(this.backgroundTexture);
    this.backgroundSprite.label = "woodenBackground";
    this.backgroundContainer.addChildAt(this.backgroundSprite, 0);
    this.cardFrameTexture = await Assets.load<Texture>(cardContainerPath);
    this.cardFrameSprite = new Sprite(this.cardFrameTexture);
    this.cardFrameSprite.anchor.set(0.5);
    this.cardFrameSprite.label = "cardFrame";
    this.cardFrameSprite.scale.set(1);
    this.deckContainer.addChild(this.cardFrameSprite, this.cardContainer);

    const sprites = await this.createCardSprites(cards);
    this.addCardsToContainer(sprites);
    this.app.stage.addChild(this.container);

    // Launcher owns the sequential card flight choreography.
    this.cardLauncher = createLauncher(this.cardContainer, sprites, {
      durationMs: AceOfShadowsConfig.tweenDurationMs,
      launchIntervalMs: AceOfShadowsConfig.launchIntervalMs,
      responsiveScaleBreakpointWidth:
        AceOfShadowsConfig.responsiveScaleBreakpointWidth,
      responsiveScaleBreakpointHeight:
        AceOfShadowsConfig.responsiveScaleBreakpointHeight,
      landedStackOffsetY: AceOfShadowsConfig.stackOffsetY,
      easing: AceOfShadowsConfig.easing,
      startXRatio: AceOfShadowsConfig.startXRatio,
      endXRatio: AceOfShadowsConfig.endXRatio,
      centerYRatio: AceOfShadowsConfig.centerYRatio,
      arcLiftY: AceOfShadowsConfig.arcLiftY,
      scale: AceOfShadowsConfig.cardScale,
    });
    return this;
  }

  resize = ({ width, height }: ResizePayload): void => {
    this.background.clear();
    if (this.backgroundTexture && this.backgroundSprite) {
      const scale = Math.max(
        width / this.backgroundTexture.width,
        height / this.backgroundTexture.height,
      );
      this.backgroundSprite.anchor.set(0.5);
      this.backgroundSprite.position.set(width / 2, height / 2);
      this.backgroundSprite.scale.set(scale);
    }
    this.deckContainer.position.set(width / 2, height / 2);
    const deckW = this.cardFrameTexture?.width ?? AceOfShadowsConfig.designWidth;
    const deckH = this.cardFrameTexture?.height ?? AceOfShadowsConfig.designHeight;
    // Fit deck art into viewport while preserving aspect ratio.
    const fit = Math.min(width / deckW, height / deckH);
    this.deckContainer.scale.set(fit);
    // Launcher works in deck-space coordinates (not raw viewport size).
    this.cardLauncher?.update(deckW, deckH);
  };

  destroy = (): void => {
    this.cardLauncher?.stop();
    this.container.destroy({ children: true });
  };

  private async createCardSprites(paths: string[]): Promise<Sprite[]> {
    const textures = await Promise.all(paths.map((path) => Assets.load(path)));
    return Array.from({ length: AceOfShadowsConfig.totalCards }, (_, index) => {
      const texture = textures[index % textures.length];
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.label = `card-${index}`;
      return sprite;
    });
  }

  private addCardsToContainer(sprites: Sprite[]): void {
    for (const [index, sprite] of sprites.entries()) {
      sprite.position.set(0, AceOfShadowsConfig.stackOffsetY * index);
      this.cardContainer.addChild(sprite);
    }
  }
}

export async function createAceOfShadowsScene(
  app: Application,
): Promise<AceOfShadowsScene> {
  const scene = new AceOfShadowsSceneImpl(app);
  return scene.init();
}

export const AceOfShadowsDesign = {
  width: AceOfShadowsConfig.designWidth,
  height: AceOfShadowsConfig.designHeight,
};

export const createScene = createAceOfShadowsScene;
export const sceneDesign = AceOfShadowsDesign;