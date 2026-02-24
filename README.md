# Softgames Assignment

A PixiJS + TypeScript mini-game playground that hosts three scenes behind a menu:

- `Ace of Shadows`
- `Magic Words`
- `Phoenix Flame`

The app is built as a single Vite project with a lightweight scene manager and route-based scene loading.

## Requirements

- `Node.js` **20.19+** (or **22.12+**)  
  (Vite 7 requirement)
- `npm` (bundled with Node.js)

## Getting Started

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## How to Open the Games

After running `npm run dev`, open the printed localhost URL in your browser.

You can enter games from the menu, or directly via routes:

- `/ace-of-shadows`
- `/magic-words`
- `/phoenix-flame`

## Games Included

### 1) Ace of Shadows

A card-stacking animation scene:

- Loads card textures from `src/data/cards.json`
- Uses a custom tween launcher (`gsap`) for sequential card flights
- Responsive scaling keeps the deck composition centered

### 2) Magic Words

A dialogue scene with avatars, inline emoji rendering, and optional autoplay:

- Fetches dialogue/avatar/emoji data from a remote mock API
- Preloads and caches textures for smooth rendering
- Plays dialogue audio clips per speaker sequence
- Supports manual next dialogue and autoplay modes

### 3) Phoenix Flame

A fire particle effect scene:

- Generates a radial fire texture from canvas
- Runs a simple particle system on Pixi ticker updates
- Includes looping ambient fire sound
- Scales background and torch art responsively

## Controls

### Global

- **Back button** (top-left in game scenes): returns to main menu

### Menu

- **Mouse / touch click** on a game card: open that scene

### Magic Words

- **Next Dialogue**: advances to the next dialogue line
- **Play/Pause**: toggles autoplay through the full dialogue list

### Ace of Shadows

- No direct player input required (presentation/tween-driven animation)

### Phoenix Flame

- No direct player input required (ambient particle scene)

## Architecture Overview

The project uses a modular, scene-based architecture with a clear shared contract:

- `src/app/type.ts` defines `ManagedScene` (`resize`, `destroy`) and scene module contracts.
- `src/app/sceneManager.ts` handles route resolution, dynamic scene imports, lifecycle cleanup, and scene mounting.
- `src/app/resizeManager.ts` centralizes responsive resize/orientation handling and provides normalized scale payloads.
- Each scene exposes `createScene` and `sceneDesign` from its local `index.ts`.
- Shared utilities (`src/shared`) host cross-scene UI elements like FPS HUD and back button.

### Scene Loading Flow

1. `src/main.ts` starts the scene manager and preloads Magic Words cache.
2. `SceneManager` checks route validity against `src/data/games.json`.
3. For game routes, it lazily imports `src/scenes/*/index.ts`.
4. The selected scene is created and mounted on the Pixi application.
5. Resize callbacks are connected through `ResizeManager`.
6. On route change, cleanup runs (`destroy`, ticker detach, app destroy, listeners).

## Project Structure

```text
src/
  app/
    createApp.ts
    resizeManager.ts
    sceneManager.ts
    type.ts
  data/
    games.json
    cards.json
  scenes/
    ace-of-shadows/
    magic-words/
    phoenix-flame/
    menuScene.ts
  shared/
    backButton.ts
    fpsHud.ts
```

## Notes

- TypeScript strict mode is enabled.
- Game routes are validated at startup to catch missing scene modules early.
- The menu is data-driven from `games.json`, so adding a new scene follows a predictable pattern:
  1) add game metadata, 2) add scene folder with `index.ts` exports.
