import { Application, Container, Text } from "pixi.js";

class FpsHud {
  private readonly app: Application;
  private readonly container: Container;
  private readonly text: Text;
  private elapsed = 0;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.container.zIndex = 1000;
    this.text = new Text({
      text: "FPS: 0",
      style: {
        fill: 0xffffff,
        fontSize: 14,
        fontWeight: "600",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    });
    this.text.position.set(12, 8);
    this.container.addChild(this.text);
  }

  mount = (): void => {
    this.app.stage.addChild(this.container);
    this.app.ticker.add(this.update);
  };

  unmount = (): void => {
    this.app.ticker.remove(this.update);
    this.container.destroy({ children: true });
  };

  private update = (): void => {
    this.elapsed += this.app.ticker.deltaMS;
    if (this.elapsed < 200) {
      return;
    }
    this.elapsed = 0;
    this.text.text = `FPS: ${Math.round(this.app.ticker.FPS)}`;
  };
}

export function attachFpsHud(app: Application): () => void {
  const hud = new FpsHud(app);
  hud.mount();
  return hud.unmount;
}