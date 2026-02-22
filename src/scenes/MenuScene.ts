import gamesData from "../data/games.json";
import type { GameCard, MenuSceneOptions } from "../types/App";

const games = gamesData as GameCard[];
const coverByTheme: Record<string, string> = {
  garden: "/assets/ui/card-cover.webp",
  sweet: "/assets/ui/messaging-cover.webp",
  tripeaks: "/assets/ui/flame-cover.webp",
};

export function renderMenuScene(
  root: HTMLElement,
  options: MenuSceneOptions = {},
): void {
  const container = document.createElement("div");
  container.className = "menu-scene";
  container.innerHTML = `
    <h1 class="menu-title">Softgame Mechanics</h1>
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
  const coverImage = coverByTheme[game.theme] ?? "/assets/ui/card-cover.webp";

  return `
    <button class="menu-card" type="button" data-url="${game.url}">
      <div class="menu-card__image">
        <img class="menu-card__cover" src="${coverImage}" alt="${game.title} cover" loading="lazy" />
      </div>
      <div class="menu-card__body">
        <h2 class="menu-card__title">${game.title}</h2>
        <p class="menu-card__description">${game.description}</p>
      </div>
    </button>
  `;
}