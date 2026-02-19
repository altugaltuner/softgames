import gamesData from "../data/games.json";
import type { GameCard, MenuSceneOptions } from "../types/Scene";

const games = gamesData as GameCard[];

export function renderMenuScene(
  root: HTMLElement,
  options: MenuSceneOptions = {},
): void {
  const container = document.createElement("div");
  container.className = "menu-scene";
  container.innerHTML = `
    <h1 class="menu-title">Games</h1>
    <div class="menu-grid">
      ${games.map(renderGameCard).join("")}
    </div>
  `;

  const grid = container.querySelector<HTMLDivElement>(".menu-grid");
  if (!grid) {
    return;
  }

  grid.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const card = target.closest<HTMLButtonElement>(".menu-card");
    if (!card) {
      return;
    }
    const url = card.dataset.url;
    if (!url) {
      return;
    }
    if (options.onNavigate) {
      options.onNavigate(url);
      return;
    }
    window.location.assign(url);
  });

  root.replaceChildren(container);
}

function renderGameCard(game: GameCard): string {
  return `
    <button class="menu-card" type="button" data-url="${game.url}">
      <div class="menu-card__image menu-card__image--${game.theme}">
        <div class="menu-card__glyph">${game.glyph}</div>
      </div>
      <div class="menu-card__body">
        <div class="menu-card__title">${game.title}</div>
        <div class="menu-card__description">${game.description}</div>
      </div>
    </button>
  `;
}