import {
  type loadingModalController,
} from "./type";

import { DEFAULT_MESSAGE } from "./config";

export function createLoadingModal(): loadingModalController {
  const overlay = document.createElement("div");
  overlay.className = "scene-loading-modal";

  const card = document.createElement("div");
  card.className = "scene-loading-modal-card";

  const spinner = document.createElement("div");
  spinner.className = "scene-loading-modal-spinner";

  const text = document.createElement("p");
  text.className = "scene-loading-modal-text";
  text.textContent = DEFAULT_MESSAGE;

  card.append(spinner, text);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  return {
    show(message = DEFAULT_MESSAGE) {
      text.textContent = message;
      overlay.classList.add("is-visible");
    },
    hide() {
      overlay.classList.remove("is-visible");
    },
  };
}