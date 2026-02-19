import { Application, Container, Text, TextStyle } from "pixi.js";

export function attachFpsHud(app: Application): () => void {
  const container = new Container();
  container.zIndex = 1000;

  const text = new Text(
    "FPS: 0",
    new TextStyle({
      fill: 0xffffff,
      fontSize: 14,
      fontWeight: "600",
      fontFamily: "Inter, system-ui, sans-serif",
    }),
  );

  text.position.set(12, 8);
  container.addChild(text);
  app.stage.addChild(container);

  let elapsed = 0;
  const update = () => {
    elapsed += app.ticker.deltaMS;
    if (elapsed < 200) {
      return;
    }
    elapsed = 0;
    text.text = `FPS: ${Math.round(app.ticker.FPS)}`;
  };

  app.ticker.add(update);

  return () => {
    app.ticker.remove(update);
    container.destroy({ children: true });
  };
}
