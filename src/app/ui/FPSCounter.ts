import { Container, Text, Ticker } from "pixi.js";

/**
 * A simple FPS counter component.
 */
export class FPSCounter extends Container {
  private readonly _text: Text;
  private _time = 0;

  constructor() {
    super();

    this._text = new Text({
      text: "FPS: 0",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 4, join: "round" },
      },
    });

    this.addChild(this._text);

    // Initial position
    this.x = 10;
    this.y = 10;

    // Ensure it's always on top visually if we use zIndex, though adding it last to stage is usually enough.
    this.zIndex = 9999;
  }

  public update(ticker: Ticker) {
    this._time += ticker.elapsedMS;
    if (this._time >= 500) {
      this._time = 0;
      this._text.text = `FPS: ${Math.round(ticker.FPS)}`;
    }
  }
}
