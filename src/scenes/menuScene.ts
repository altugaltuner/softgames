import gamesData from "../data/games.json";
import type { GameCard, MenuSceneOptions } from "../app/type";

const games = gamesData as GameCard[];
const coverByTheme: Record<string, string> = {
  garden: "/assets/ui/card-cover.webp",
  sweet: "/assets/ui/messaging-cover.webp",
  tripeaks: "/assets/ui/flame-cover.webp",
};
const DEFAULT_COVER_IMAGE = "/assets/ui/card-cover.webp";
const coverImageElementCache = new Map<string, HTMLImageElement>();
const coverImagePreloadPromises = new Map<string, Promise<void>>();

// Preload common card covers at module load to reduce first-menu flicker.
preloadCoverImages();

export function renderMenuScene(
  root: HTMLElement,
  options: MenuSceneOptions = {},
): void {
  preloadCoverImages();
  const navigateTo = options.onNavigate ?? ((url: string) => window.location.assign(url));
  const container = document.createElement("div");
  container.className = "menu-scene";
  const title = document.createElement("h1");
  title.className = "menu-title";
  title.textContent = "Softgame Mechanics";
  const grid = document.createElement("div");
  grid.className = "menu-grid";
  for (const game of games) {
    grid.appendChild(renderGameCard(game));
  }
  const footer = document.createElement("p");
  footer.className = "menu-footer";
  footer.textContent = "made by altug altuner";
  container.append(title, grid, footer);

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
    navigateTo(url);
  });

  root.replaceChildren(container);
}

function renderGameCard(game: GameCard): HTMLButtonElement {
  const coverImage = coverByTheme[game.theme] ?? DEFAULT_COVER_IMAGE;
  const card = document.createElement("button");
  card.className = "menu-card";
  card.type = "button";
  card.dataset.url = game.url;
  const imageWrap = document.createElement("div");
  imageWrap.className = "menu-card-image";
  const cover = getCachedCoverImage(coverImage, `${game.title} cover`);
  cover.className = "menu-card-cover";
  imageWrap.appendChild(cover);
  const body = document.createElement("div");
  body.className = "menu-card-body";
  const title = document.createElement("h2");
  title.className = "menu-card-title";
  title.textContent = game.title;
  const description = document.createElement("p");
  description.className = "menu-card-description";
  description.textContent = game.description;
  body.append(title, description);
  card.append(imageWrap, body);
  return card;
}

function preloadCoverImages(src?: string): void {
  const targets = src ? [src] : Array.from(new Set(Object.values(coverByTheme)));

  for (const targetSrc of targets) {
    if (coverImageElementCache.has(targetSrc) || coverImagePreloadPromises.has(targetSrc)) {
      continue;
    }

    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "high";
    image.src = targetSrc;
    const preloadPromise = image
      .decode()
      .catch(
        () =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
      )
      .then(() => {
        // Cache the decoded element so card render can clone without re-decoding.
        coverImageElementCache.set(targetSrc, image);
      });
    coverImagePreloadPromises.set(targetSrc, preloadPromise);
  }
}

function getCachedCoverImage(src: string, alt: string): HTMLImageElement {
  const cached = coverImageElementCache.get(src);
  if (cached) {
    const cloned = cached.cloneNode(false) as HTMLImageElement;
    cloned.alt = alt;
    cloned.loading = "eager";
    return cloned;
  }

  const image = new Image();
  image.src = src;
  image.alt = alt;
  image.decoding = "async";
  image.loading = "eager";
  preloadCoverImages(src);
  return image;
}