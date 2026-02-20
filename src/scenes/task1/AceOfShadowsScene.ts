import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import cardsData from "../../data/cards.json";
import { AceOfShadowsConfig } from "./config";
import { createSequentialCardLauncher } from "./tween/Tween";

export type AceOfShadowsScene = {
  container: Container;
  resize: (payload: { width: number; height: number; scale: number }) => void;
  destroy: () => void;
};

const cards = cardsData as string[];

export async function createAceOfShadowsScene(
  app: Application,
): Promise<AceOfShadowsScene> {
  const { container, backgroundContainer, cardContainer } =
    createSceneContainers();

  const background = createBackground(backgroundContainer);
  const sprites = await createCardSprites(cards);
  addCardsToContainer(cardContainer, sprites);
  addToStage(app, container);

  const cardLauncher = createSequentialCardLauncher(cardContainer, sprites, {

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

  return {
    container,

    resize: ({ width, height, scale: _scale }) => {
      updateBackground(background, width, height);
      cardLauncher.updatePosAndScale(width, height);
    },

    destroy: () => {
      cardLauncher.cancel();
      container.destroy({ children: true });
    },
  };
}

export const AceOfShadowsDesign = {
  width: AceOfShadowsConfig.designWidth,
  height: AceOfShadowsConfig.designHeight,
};

function createSceneContainers(): {
  container: Container;
  backgroundContainer: Container;
  cardContainer: Container;
} {
  const container = new Container();
  container.sortableChildren = true;

  const backgroundContainer = new Container();
  const cardContainer = new Container();
  container.addChild(backgroundContainer, cardContainer);
  container.label = "AceOfShadowsScene";
  backgroundContainer.label = "backgroundContainer";
  cardContainer.label = "cardContainer";

  return { container, backgroundContainer, cardContainer };
}

function createBackground(parent: Container): Graphics {
  const background = new Graphics();
  parent.addChild(background);
  return background;
}

async function createCardSprites(paths: string[]): Promise<Sprite[]> {
  const textures = await Promise.all(paths.map((path) => Assets.load(path)));
  return Array.from({ length: AceOfShadowsConfig.totalCards }, (_, index) => {
    const texture = textures[index % textures.length];
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.label = `card-${index}`;
    return sprite;
  });
}

function addCardsToContainer(container: Container, sprites: Sprite[]): void {
  for (const [index, sprite] of sprites.entries()) {
    sprite.position.set(0, AceOfShadowsConfig.stackOffsetY * index);
    container.addChild(sprite);
  }
}

function addToStage(app: Application, container: Container): void {
  app.stage.addChild(container);
}

function updateBackground(
  background: Graphics,
  width: number,
  height: number,
): void {
  const size = Math.max(width, height) * 3;
  background.clear();
  background.fill({ color: 0x0b0d12 }).rect(-size, -size, size * 3, size * 3);
}
