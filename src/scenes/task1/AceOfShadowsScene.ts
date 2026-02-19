import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import cardsData from "../../data/cards.json";

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;

export type AceOfShadowsScene = {
  container: Container;
  resize: (payload: { width: number; height: number; scale: number }) => void;
  destroy: () => void;
};

const cards = cardsData as string[];

export async function createAceOfShadowsScene(
  app: Application,
): Promise<AceOfShadowsScene> {
  const container = new Container();
  container.sortableChildren = true;

  const backgroundContainer = new Container();
  const cardContainer = new Container();
  container.addChild(backgroundContainer, cardContainer);
  container.label = "AceOfShadowsScene";
  backgroundContainer.label = "backgroundContainer";
  cardContainer.label = "cardContainer";

  const background = new Graphics();
  backgroundContainer.addChild(background);

  const textures = await Promise.all(cards.map((path) => Assets.load(path)));
  const sprites = textures.map((texture) => {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
  });

  for (const sprite of sprites) {
    sprite.position.set(0, 0);
    cardContainer.addChild(sprite);
  }

  app.stage.addChild(container);

  return {
    container,
    resize: ({ width, height, scale: _scale }) => {
      background.clear();
      background.beginFill(0x0b0d12);
      background.drawRect(0, 0, width, height);
      background.endFill();

      cardContainer.position.set(width / 2, height / 2);
    },
    destroy: () => {
      container.destroy({ children: true });
    },
  };
}

export const AceOfShadowsDesign = {
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
};
