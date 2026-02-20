import { Application, Container, Graphics, Text } from "pixi.js";
import type { BackButtonOptions } from "../types/Shared";

class BackButtonHud {
  private readonly app: Application;
  private readonly options: BackButtonOptions;
  private readonly container: Container;
  private readonly button: Graphics;
  private readonly label: Text;

  constructor(app: Application, options: BackButtonOptions) {
    this.app = app;
    this.options = options;
    this.container = new Container();
    this.container.zIndex = 100;

    this.button = new Graphics();
    this.button.roundRect(15, 34, 30, 30, 8);
    this.button.fill({ color: 0x1f2a44, alpha: 1 });
    this.button.stroke({ color: 0xffffff, alpha: 0.75, width: 1 });
    this.button.eventMode = "static";
    this.button.cursor = "pointer";

    this.label = new Text({
      text: "<",
      style: {
        fill: 0xffffff,
        fontSize: 18,
        fontWeight: "700",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    });
    this.label.position.set(22, 38);
    this.label.eventMode = "none";
  }

  mount = (): void => {
    this.button.on("pointertap", this.onPointerTap);
    this.container.addChild(this.button, this.label);
    this.app.stage.addChild(this.container);
  };

  unmount = (): void => {
    this.button.off("pointertap", this.onPointerTap);
    this.container.destroy({ children: true });
  };

  private onPointerTap = (): void => {
    this.options.onClick();
  };
}


export function addBackButton(
  app: Application,
  options: BackButtonOptions,
): () => void {
  const button = new BackButtonHud(app, options);
  button.mount();
  return button.unmount;
}