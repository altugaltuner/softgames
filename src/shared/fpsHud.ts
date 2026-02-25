import { Application, Container, Text } from "pixi.js";
import { FpsHudConfig } from "./config";

class FpsHud {

  private readonly app: Application;
  private readonly container: Container;
  private readonly text: Text;
  private elapsed = 0;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.container.zIndex = FpsHudConfig.containerZIndex;
    this.text = new Text({
      text: FpsHudConfig.initialText,
      style: FpsHudConfig.textStyle,
    });
    this.text.position.set(FpsHudConfig.textPosition.x, FpsHudConfig.textPosition.y);
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
    if (this.elapsed < FpsHudConfig.updateIntervalMs) {
      return;
    }
    this.elapsed = 0;
    this.text.text = `${FpsHudConfig.textPrefix} ${Math.round(this.app.ticker.FPS)}`;
  };
}

export function attachFpsHud(app: Application): () => void {
  const hud = new FpsHud(app);
  hud.mount();
  return hud.unmount;
}