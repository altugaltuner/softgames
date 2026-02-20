import { Application, Container, Graphics } from "pixi.js";
import { createApp } from "./createApp";
import { createResizeManager } from "./ResizeManager";
import gamesData from "../data/games.json";
import { renderMenuScene } from "../scenes/menuScene";
import {
  AceOfShadowsDesign,
  createAceOfShadowsScene,
} from "../scenes/ace-of-shadows/Scene";
import { createPhoenixFlameScene } from "../scenes/phoenix-flame";
import { addBackButton } from "../shared/AddBackButton";
import { attachFpsHud } from "../shared/FpsHud";
import type { ManagedScene } from "../types/App";
import type { GameCard } from "../types/Scene";

const games = gamesData as GameCard[];
const GAME_ROUTES = new Set(games.map((game) => game.url));

class SceneManager {
  private readonly root: HTMLElement;
  private cleanup: (() => void) | null = null;
  private renderToken = 0;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  start(): void {
    window.addEventListener("popstate", this.onPopState);
    void this.renderRoute();
  }

  private readonly onPopState = () => {
    void this.renderRoute();
  };

  private navigate = (url: string): void => {
    if (window.location.pathname === url) {
      return;
    }
    window.history.pushState({}, "", url);
    void this.renderRoute();
  };

  private async renderRoute(): Promise<void> {
    const token = ++this.renderToken;

    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    const path = window.location.pathname;

    if (!GAME_ROUTES.has(path)) {
      document.documentElement.classList.remove("is-game");
      document.body.classList.remove("is-game");
      renderMenuScene(this.root, { onNavigate: this.navigate });
      return;
    }

    const app = await createApp(this.root, {
      backgroundColor: 0x0b0d12,
      mount: false,
    });

    if (token !== this.renderToken) {
      app.destroy(true);
      return;
    }

    this.root.replaceChildren(app.canvas);
    document.documentElement.classList.add("is-game");
    document.body.classList.add("is-game");

    const scene = await this.createSceneForPath(path, app);
    if (token !== this.renderToken) {
      scene.destroy();
      app.destroy(true);
      return;
    }

    const detachFps = attachFpsHud(app);
    const detachBackButton = addBackButton(app, {
      onClick: () => this.navigate("/"),
    });
    const detachResize = createResizeManager(
      AceOfShadowsDesign.width,
      AceOfShadowsDesign.height,
      scene.resize,
    );

    this.cleanup = () => {
      detachResize();
      detachFps();
      detachBackButton();
      scene.destroy();
      app.destroy(true);
      document.documentElement.classList.remove("is-game");
      document.body.classList.remove("is-game");
    };
  }

  private async createSceneForPath(
    path: string,
    app: Application,
  ): Promise<ManagedScene> {
    if (path === "/ace-of-shadows") {
      return createAceOfShadowsScene(app);
    }
    if (path === "/phoenix-flame") {
      return createPhoenixFlameScene(app);
    }
    return this.createBackgroundOnlyScene(app);
  }

  private createBackgroundOnlyScene(app: Application): ManagedScene {
    const container = new Container();
    const background = new Graphics();
    container.addChild(background);
    app.stage.addChild(container);

    return {
      resize: ({ width, height }) => {
        const size = Math.max(width, height) * 3;
        background.clear();
        background
          .fill({ color: 0x0b0d12 })
          .rect(-size, -size, size * 3, size * 3);
      },
      destroy: () => {
        container.destroy({ children: true });
      },
    };
  }
}

export function startSceneManager(root: HTMLElement): void {
  const manager = new SceneManager(root);
  manager.start();
}