import { Application } from "pixi.js";
import { createApp } from "./CreateApp";
import { createResizeManager } from "./ResizeManager";
import type { GameCard, ManagedScene, SceneDesign, SceneModule } from "./type";
import gamesData from "../data/games.json";
import { renderMenuScene } from "../scenes/MenuScene";
import { addBackButton } from "../shared/AddBackButton";
import { attachFpsHud } from "../shared/FpsHud";

const games = gamesData as GameCard[];
const GAME_ROUTES = new Set(games.map((game) => game.url));

const sceneModuleLoaders = import.meta.glob<SceneModule>("../scenes/*/index.ts");

function routeToScene(route: string): string {
  const slug = route.replace(/^\/+/, "").replace(/\/+$/, "");
  return `../scenes/${slug}/index.ts`;
}

class SceneManager {
  private readonly root: HTMLElement;
  private cleanup: (() => void) | null = null;
  private renderToken = 0;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  start(): void {
    this.validateGameScenes();
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

    const { scene, design } = await this.createSceneForPath(path, app);
    if (token !== this.renderToken) {
      scene.destroy();
      app.destroy(true);
      return;
    }

    const detachFps = attachFpsHud(app);
    const detachBackButton = addBackButton(app, {
      onClick: () => {
        requestAnimationFrame(() => this.navigate("/"));
      },
    });
    const detachResize = createResizeManager(
      design.width,
      design.height,
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
  ): Promise<{ scene: ManagedScene; design: SceneDesign }> {
    const modulePath = routeToScene(path);
    const loadSceneModule = sceneModuleLoaders[modulePath];

    if (!loadSceneModule) {
      throw new Error(`[SceneManager] Missing scene module for route: ${path}`);
    }

    const module = await loadSceneModule();
    return {
      scene: await module.createScene(app),
      design: module.sceneDesign,
    };
  }

  private validateGameScenes(): void {
    const missingRoutes: string[] = [];

    for (const game of games) {
      const modulePath = routeToScene(game.url);
      if (!sceneModuleLoaders[modulePath]) {
        missingRoutes.push(game.url);
      }
    }

    if (missingRoutes.length > 0) {
      throw new Error(
        `[SceneManager] games.json route(s) missing scene module: ${missingRoutes.join(", ")}`,
      );
    }
  }
}

export function startSceneManager(root: HTMLElement): void {
  const manager = new SceneManager(root);
  manager.start();
}