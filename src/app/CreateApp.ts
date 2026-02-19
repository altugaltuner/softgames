import { Application } from "pixi.js";

type CreateAppOptions = {
  backgroundColor?: number;
  mount?: boolean;
};

export async function createApp(
  root: HTMLElement,
  options: CreateAppOptions = {},
): Promise<Application> {
  const app = new Application();

  await app.init({
    antialias: true,
    backgroundColor: options.backgroundColor ?? 0x0b0d12,
    resizeTo: window,
  });

  app.canvas.style.display = "block";
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";

  if (options.mount !== false) {
    root.replaceChildren(app.canvas);
  }

  return app;
}
