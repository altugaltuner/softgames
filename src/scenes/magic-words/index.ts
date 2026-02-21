import { Application, Container, Sprite, Texture } from "pixi.js";
import type { ManagedScene } from "../../types/App";
import {
  getAvatarTextureByName,
  getBubbleTexture,
  preloadMagicWordsCache,
} from "./cache";

type AvatarSlot = {
  container: Container;
  bubble: Sprite;
  avatar: Sprite;
};

export { preloadMagicWordsCache } from "./cache";

export function createMagicWordsScene(app: Application): ManagedScene {
  const sceneContainer = new Container();
  sceneContainer.label = "MagicWordsScene";

  const sheldonSlot = createAvatarSlot("SheldonContainer", "SheldonSprite");
  const pennySlot = createAvatarSlot("PennyContainer", "PennySprite");
  const leonardSlot = createAvatarSlot("LeonardContainer", "LeonardSprite");

  sceneContainer.addChild(
    sheldonSlot.container,
    pennySlot.container,
    leonardSlot.container,
  );
  app.stage.addChild(sceneContainer);

  void applyTexturesToScene(
    [sheldonSlot.bubble, pennySlot.bubble, leonardSlot.bubble],
    {
      Sheldon: sheldonSlot.avatar,
      Penny: pennySlot.avatar,
      Leonard: leonardSlot.avatar,
    },
  );

  return {
    resize: ({ width, height }) => {
      const squareSize = Math.max(64, Math.min(width, height) * 0.2);
      const bubbleSize = squareSize * 1.8;

      sheldonSlot.container.position.set(width * 0.15, height * 0.5);
      sheldonSlot.avatar.width = squareSize;
      sheldonSlot.avatar.height = squareSize;
      sheldonSlot.bubble.width = bubbleSize;
      sheldonSlot.bubble.height = bubbleSize;

      pennySlot.container.position.set(width * 0.6, height * 0.5);
      pennySlot.avatar.width = squareSize;
      pennySlot.avatar.height = squareSize;
      pennySlot.bubble.width = bubbleSize;
      pennySlot.bubble.height = bubbleSize;

      leonardSlot.container.position.set(width * 0.8, height * 0.5);
      leonardSlot.avatar.width = squareSize;
      leonardSlot.avatar.height = squareSize;
      leonardSlot.bubble.width = bubbleSize;
      leonardSlot.bubble.height = bubbleSize;
    },
    destroy: () => {
      sceneContainer.destroy({ children: true });
    },
  };
}

function createAvatarSlot(containerLabel: string, avatarLabel: string): AvatarSlot {
  const container = new Container();
  container.label = containerLabel;

  const bubble = new Sprite(Texture.WHITE);
  bubble.label = `${avatarLabel}Bubble`;
  bubble.anchor.set(0.5);
  bubble.visible = false;

  const avatar = new Sprite(Texture.WHITE);
  avatar.label = avatarLabel;
  avatar.anchor.set(0.5);
  avatar.visible = false;

  container.addChild(bubble, avatar);
  return { container, bubble, avatar };
}

async function applyTexturesToScene(
  bubbles: Sprite[],
  avatarsByName: Record<string, Sprite>,
): Promise<void> {
  await preloadMagicWordsCache();

  const bubbleTexture = getBubbleTexture();
  if (bubbleTexture) {
    for (const bubble of bubbles) {
      bubble.texture = bubbleTexture;
      bubble.visible = true;
    }
  }

  for (const [name, avatarSprite] of Object.entries(avatarsByName)) {
    const texture = await getAvatarTextureByName(name);
    if (!texture) {
      continue;
    }
    avatarSprite.texture = texture;
    avatarSprite.visible = true;
  }
}

