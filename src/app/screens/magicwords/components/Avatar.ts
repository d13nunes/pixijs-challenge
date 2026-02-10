import { Sprite, Texture, Graphics } from "pixi.js";
import { Label } from "../../../ui/Label";

export class Avatar extends Sprite {
  private _sprite: Sprite;
  private _nameLabel: Label;
  private _placeholderTexture: Texture | null = null;
  private outline: Graphics;

  constructor() {
    super();
    this.outline = new Graphics();
    this.addChild(this.outline);
    this._sprite = new Sprite();
    this._sprite.anchor.set(0.5, 1);
    this.addChild(this._sprite);

    this._nameLabel = new Label({
      text: "",
      style: {
        fill: 0xffffff,
        fontSize: 24,
        fontWeight: "bold",
        align: "center",
      },
    });
    this._nameLabel.anchor.set(0.5, 1);
    this.addChild(this._nameLabel);

    this.updateLayout();
  }

  public async setPlaceholder(texture: Texture) {
    this._placeholderTexture = texture;
  }

  public setAvatar(texture: Texture | null, name: string) {
    if (texture) {
      this._sprite.texture = texture;
    } else if (this._placeholderTexture) {
      this._sprite.texture = this._placeholderTexture;
    } else {
      this._sprite.texture = Texture.EMPTY;
    }
    const width = 64;
    const height = 64;
    const scale = Math.min(
      width / this._sprite.texture.width,
      height / this._sprite.texture.height,
    );
    this._sprite.scale.set(scale);
    this._nameLabel.text = name;
    this.updateLayout();
  }

  public updateLayout() {
    const ySpacing = 0;
    this._sprite.y = 0;
    this._nameLabel.position.set(0, this._nameLabel.height + ySpacing);
    const yPadding = 6;
    const xPadding = 12;
    const width =
      Math.max(this._sprite.width, this._nameLabel.width) + xPadding * 2;
    const height =
      this._sprite.height + ySpacing + this._nameLabel.height + 2 * yPadding;
    this.outline.clear();
    this.outline
      .roundRect(-width / 2, -height / 2 - yPadding, width, height, 10)
      .fill({ color: 0x1a1a1a, alpha: 0.9 })
      .stroke({ width: 2, color: 0xffffff, alpha: 1 });
  }
}
