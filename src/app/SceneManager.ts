import { Application } from "pixi.js";
import { createApp } from "./CreateApp";
import { createResizeManager } from "./ResizeManager";
import type { GameCard, ManagedScene, SceneDesign, SceneModule } from "./type";
import gamesData from "../data/games.json";
import { renderMenuScene } from "../scenes/MenuScene";
import { addBackButton } from "../shared/backButton";
import { attachFpsHud } from "../shared/FpsHud";

const games = gamesData as GameCard[];
const GAME_ROUTES = new Set(games.map((game) => game.url));
const sceneModuleLoaders = import.meta.glob<SceneModule>("../scenes/*/index.ts");

function routeToScene(route: string): string {
  const slug = route.replace(/^\/+/, "").replace(/\/+$/, "");
  return `../scenes/${slug}/index.ts`;
}

function setDocumentGameMode(isGame: boolean): void {
  document.documentElement.classList.toggle("is-game", isGame);
  document.body.classList.toggle("is-game", isGame);
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
      setDocumentGameMode(false);
      renderMenuScene(this.root, { onNavigate: this.navigate });
      return;
    }

    if (!this.root.firstElementChild) {
      setDocumentGameMode(true);
    }
    let app: Application | null = null;
    let scene: ManagedScene | null = null;

    try {
      app = await createApp(this.root, {
        backgroundColor: 0x0b0d12,
        mount: false,
      });

      if (token !== this.renderToken) {
        throw new Error("Route render superseded while creating app.");
      }

      const resolved = await this.createSceneForPath(path, app);
      scene = resolved.scene;

      if (token !== this.renderToken) {
        throw new Error("Route render superseded while creating scene.");
      }

      const detachFps = attachFpsHud(app);
      const detachBackButton = addBackButton(app, {
        onClick: () => {
          requestAnimationFrame(() => this.navigate("/"));
        },
      });
      const detachResize = createResizeManager(
        resolved.design.width,
        resolved.design.height,
        scene.resize,
      );

      setDocumentGameMode(true);
      this.root.replaceChildren(app.canvas);

      this.cleanup = () => {
        detachResize();
        detachFps();
        detachBackButton();
        scene?.destroy();
        app?.destroy(true);
      };
    } catch (error) {
      scene?.destroy();
      app?.destroy(true);

      if (token !== this.renderToken) {
        return;
      }

      setDocumentGameMode(false);
      renderMenuScene(this.root, { onNavigate: this.navigate });
      throw error;
    }
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