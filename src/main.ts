import "./style.css";
import { startSceneManager } from "./app/sceneManager";
import { preloadMagicWordsCache } from "./scenes/magic-words";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app root element.");
}

void preloadMagicWordsCache();
startSceneManager(root);
