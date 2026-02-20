import "./style.css";
import { startSceneManager } from "./app/SceneManager";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app root element.");
}
startSceneManager(root);
