import { Application } from "pixi.js";
import { createApp } from "./createApp";
import { createResizeManager } from "./resizeManager";
import type { GameCard, ManagedScene, SceneDesign, SceneModule } from "./type";
import gamesData from "../data/games.json";
import { renderMenuScene } from "../scenes/menuScene";
import { addBackButton } from "../shared/backButton";
import { attachFpsHud } from "../shared/fpsHud";
import { addFullScreenButton } from "../shared/fullScreen";
import { createLoadingModal } from "../shared/loadingModal";

const games = gamesData as GameCard[];
const GAME_ROUTES = new Set(games.map((game) => game.url));
const sceneModuleLoaders = import.meta.glob<SceneModule>("../scenes/*/index.ts");

class SceneManager {
  private readonly root: HTMLElement;
  private readonly loadingModal = createLoadingModal();
  private readonly initializedRoutes = new Set<string>();
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
      this.setDocumentGameMode(false);
      renderMenuScene(this.root, { onNavigate: this.navigate });
      return;
    }

    const shouldShowLoadingModal = !this.initializedRoutes.has(path);
    if (shouldShowLoadingModal) {
      this.loadingModal.show("Oyun yukleniyor...");
    }

    if (!this.root.firstElementChild) {
      this.setDocumentGameMode(true);
    }
    let app: Application | null = null;
    let scene: ManagedScene | null = null;

    try {
      app = await createApp(this.root, {
        backgroundColor: 0x0b0d12,
        mount: false,
      });

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
      const detachFullScreenButton = addFullScreenButton(app);
      const detachResize = createResizeManager(
        resolved.design.width,
        resolved.design.height,
        scene.resize,
      );

      this.setDocumentGameMode(true);
      this.root.replaceChildren(app.canvas);

      this.cleanup = () => {
        detachResize();
        detachFps();
        detachBackButton();
        detachFullScreenButton();
        scene?.destroy();
        app?.destroy(true);
      };
      this.initializedRoutes.add(path);
    } catch (error) {
      scene?.destroy();
      app?.destroy(true);

      if (token !== this.renderToken) {
        return;
      }
      this.setDocumentGameMode(false);
      renderMenuScene(this.root, { onNavigate: this.navigate });
      throw error;
    } finally {
      if (shouldShowLoadingModal) {
        this.loadingModal.hide();
      }
    }
  }

  private async createSceneForPath(
    path: string,
    app: Application,
  ): Promise<{ scene: ManagedScene; design: SceneDesign }> {
    const slug = path.replace(/^\/+/, "").replace(/\/+$/, "");
    const modulePath = `../scenes/${slug}/index.ts`;
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

  private setDocumentGameMode(isGame: boolean): void {
    document.documentElement.classList.toggle("is-game", isGame);
    document.body.classList.toggle("is-game", isGame);
  }
}

export function startSceneManager(root: HTMLElement): void {
  const manager = new SceneManager(root);
  manager.start();
}