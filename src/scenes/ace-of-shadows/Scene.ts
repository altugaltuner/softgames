import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import cardsData from "../../data/cards.json";
import { AceOfShadowsConfig } from "./config";
import { createSequentialCardLauncher } from "./tween-system/Tween";
import type { AceOfShadowsScene } from "../../types/AceOfShadows";
import type { ResizePayload } from "../../types/App";

const cards = cardsData as string[];

class AceOfShadowsSceneImpl implements AceOfShadowsScene {
  readonly container = new Container();
  private readonly app: Application;
  private readonly backgroundContainer = new Container();
  private readonly cardContainer = new Container();
  private readonly background = new Graphics();
  private cardLauncher: ReturnType<typeof createSequentialCardLauncher> | null =
    null;

  constructor(app: Application) {
    this.app = app;
    this.container.sortableChildren = true;
    this.container.addChild(this.backgroundContainer, this.cardContainer);
    this.container.label = "AceOfShadowsScene";
    this.backgroundContainer.label = "backgroundContainer";
    this.cardContainer.label = "cardContainer";
    this.backgroundContainer.addChild(this.background);
  }

  async init(): Promise<AceOfShadowsScene> {
    const sprites = await this.createCardSprites(cards);
    this.addCardsToContainer(sprites);
    this.app.stage.addChild(this.container);

    this.cardLauncher = createSequentialCardLauncher(this.cardContainer, sprites, {
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
      scale: AceOfShadowsConfig.cardScale,
    });

    return this;
  }

  resize = ({ width, height }: ResizePayload): void => {
    const size = Math.max(width, height) * 3;
    this.background.clear();
    this.background
      .fill({ color: 0x0b0d12 })
      .rect(-size, -size, size * 3, size * 3);
    this.cardLauncher?.updatePosAndScale(width, height);
  };

  destroy = (): void => {
    this.cardLauncher?.cancel();
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