import { Application, Container, Graphics, Text } from "pixi.js";
import { BackButtonConfig, type BackButtonOptions } from "./config";

class BackButton {

  private readonly app: Application;
  private readonly options: BackButtonOptions;
  private readonly container: Container;
  private readonly button: Graphics;
  private readonly label: Text;

  constructor(app: Application, options: BackButtonOptions) {
    this.app = app;
    this.options = options;
    this.container = new Container();
    this.container.zIndex = BackButtonConfig.containerZIndex;

    this.button = new Graphics();
    this.button.roundRect(
      BackButtonConfig.shape.x,
      BackButtonConfig.shape.y,
      BackButtonConfig.shape.width,
      BackButtonConfig.shape.height,
      BackButtonConfig.shape.radius,
    );
    this.button.fill(BackButtonConfig.fill);
    this.button.stroke(BackButtonConfig.stroke);
    this.button.eventMode = "static";
    this.button.cursor = "pointer";

    this.label = new Text({
      text: BackButtonConfig.text,
      style: BackButtonConfig.textStyle,
    });
    this.label.position.set(
      BackButtonConfig.textPosition.x,
      BackButtonConfig.textPosition.y,
    );
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
  const button = new BackButton(app, options);
  button.mount();
  return button.unmount;
}