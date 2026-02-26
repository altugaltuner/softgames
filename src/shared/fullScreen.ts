import { Application, Container, Graphics, Text } from "pixi.js";
import { FullScreenConfig } from "./config";
import {
  type FullScreenCapableDocument,
  type FullScreenCapableElement,
} from "./type";

export class FullScreenButton {

  private readonly app: Application;
  private readonly container: Container;
  private readonly button: Graphics;
  private readonly label: Text;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.container.zIndex = FullScreenConfig.containerZIndex;

    this.button = new Graphics();
    this.button.roundRect(
      FullScreenConfig.shape.x,
      FullScreenConfig.shape.y,
      FullScreenConfig.shape.width,
      FullScreenConfig.shape.height,
      FullScreenConfig.shape.radius,
    );
    this.button.fill(FullScreenConfig.fill);
    this.button.stroke(FullScreenConfig.stroke);
    this.button.position.set(
      FullScreenConfig.buttonPosition.x,
      FullScreenConfig.buttonPosition.y,
    );
    this.button.eventMode = "static";
    this.button.cursor = "pointer";

    this.label = new Text({
      text: FullScreenConfig.text,
      style: FullScreenConfig.textStyle,
    });
    this.label.position.set(
      FullScreenConfig.textPosition.x,
      FullScreenConfig.textPosition.y,
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
    void this.toggleFullScreen();
  };


  private toggleFullScreen = async (): Promise<void> => {
    if (this.isFullScreenActive()) {
      await this.exitFullScreen();
    } else {
      await this.enterFullScreen();
    }

  };

  private enterFullScreen = async (): Promise<void> => {
    const target = document.documentElement as FullScreenCapableElement;
    if (target.requestFullscreen) {
      await target.requestFullscreen();
      return;
    }
    if (target.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen();
      return;
    }
    if (target.msRequestFullscreen) {
      await target.msRequestFullscreen();
    }
  };

  private exitFullScreen = async (): Promise<void> => {
    const fullScreenDocument = document as FullScreenCapableDocument;
    if (fullScreenDocument.exitFullscreen) {
      await fullScreenDocument.exitFullscreen();
      return;
    }
    if (fullScreenDocument.webkitExitFullscreen) {
      await fullScreenDocument.webkitExitFullscreen();
      return;
    }
    if (fullScreenDocument.msExitFullscreen) {
      await fullScreenDocument.msExitFullscreen();
    }
  };

  private isFullScreenActive = (): boolean => {
    const fullScreenDocument = document as FullScreenCapableDocument;
    return Boolean(
      fullScreenDocument.fullscreenElement ??
      fullScreenDocument.webkitFullscreenElement ??
      fullScreenDocument.msFullscreenElement,
    );
  };
}

export function addFullScreenButton(app: Application): () => void {
  const fullScreenButton = new FullScreenButton(app);
  fullScreenButton.mount();
  return fullScreenButton.unmount;
}
