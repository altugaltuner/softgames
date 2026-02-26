import "./style.css";
import { startSceneManager } from "./app/sceneManager";
import { ensureSharedFontsReady } from "./shared/fontPreload";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app root element.");
}

async function bootstrap(): Promise<void> {
  await ensureSharedFontsReady();
  startSceneManager(root as HTMLElement);
}

void bootstrap();
