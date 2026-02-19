import "./style.css";
import { createApp } from "./app/CreateApp";
import { attachFpsHud } from "./app/FpsHud";
import { createResizeManager } from "./app/ResizeManager";
import { renderMenuScene } from "./scenes/MenuScene";
import {
  AceOfShadowsDesign,
  createAceOfShadowsScene,
} from "./scenes/task1/AceOfShadowsScene";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app root element.");
}
const appRoot: HTMLElement = root;

let cleanup: (() => void) | null = null;

function navigate(url: string): void {
  if (window.location.pathname === url) {
    return;
  }
  window.history.pushState({}, "", url);
  void renderRoute();
}

window.addEventListener("popstate", () => {
  void renderRoute();
});

async function renderRoute(): Promise<void> {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }

  const path = window.location.pathname;

  if (path === "/ace-of-shadows") {
    const app = await createApp(appRoot, {
      backgroundColor: 0x0b0d12,
      mount: false,
    });
    appRoot.replaceChildren(app.canvas);
    document.body.classList.add("is-game");
    const scene = await createAceOfShadowsScene(app);

    const detachFps = attachFpsHud(app);
    const detachResize = createResizeManager(
      app,
      AceOfShadowsDesign.width,
      AceOfShadowsDesign.height,
      scene.resize,
    );

    cleanup = () => {
      detachResize();
      detachFps();
      scene.destroy();
      app.destroy(true);
      document.body.classList.remove("is-game");
    };

    return;
  }

  document.body.classList.remove("is-game");
  renderMenuScene(appRoot, { onNavigate: navigate });
}

void renderRoute();
