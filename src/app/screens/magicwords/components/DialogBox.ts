import {
  Container,
  Graphics,
  Text,
  TextStyle,
  TextStyleOptions,
  Sprite,
  Texture,
} from "pixi.js";

export class DialogBox extends Container {
  private _textStyle: TextStyle;
  private bg: Graphics;
  private contentContainer: Container;

  private padding: number = 20;
  private lastWidth: number = 400;
  private _fullHeight: number = 0;

  public get fullHeight() {
    return this._fullHeight + this.padding * 2;
  }

  private fullText: string = "";
  private emojis: Record<string, Texture> = {};
  private _isTyping: boolean = false;

  public get isTyping() {
    return this._isTyping;
  }

  constructor(style: TextStyleOptions) {
    super();

    this._textStyle = new TextStyle({
      ...style,
      wordWrap: false,
      breakWords: false,
    });

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.contentContainer = new Container();
    this.contentContainer.position.set(this.padding, this.padding);
    this.addChild(this.contentContainer);
  }

  public show(message: string, emojis: Record<string, Texture> = {}) {
    this.fullText = message;
    this.emojis = emojis;
    this.layout();
  }

  public finish() {
    this._isTyping = false;
  }

  public resize(targetWidth: number) {
    this.lastWidth = targetWidth;
    this.layout();
  }

  private drawBackground() {
    const h = this.fullHeight;
    const w = this.lastWidth;

    this.bg
      .clear()
      .roundRect(0, 0, w, h, 15)
      .fill({ color: 0x1a1a1a, alpha: 0.9 })
      .stroke({ width: 2, color: 0xffffff, alpha: 1 });
  }

  private layout() {
    this.contentContainer.removeChildren(); // Clean up old tokens
    if (!this.fullText) return;

    const maxWidth = this.lastWidth - this.padding * 2;

    // Measure metrics using a temp Text object (No TextMetrics)
    const tempText = new Text({ text: "M", style: this._textStyle });
    const lineHeight = tempText.height;
    tempText.text = " ";
    const spaceWidth = tempText.width;
    tempText.destroy();

    // Font size for emoji scaling
    const fontSize =
      typeof this._textStyle.fontSize === "number"
        ? this._textStyle.fontSize
        : parseFloat(String(this._textStyle.fontSize)) || 26;

    let cursorX = 0;
    let cursorY = 0;

    // Split by Emojis, Newlines, and Spaces
    // Delimiters are kept in the array
    const tokens = this.fullText
      .split(/({[^}]+})|(\n)|(\s+)/g)
      .filter((t) => t && t.length > 0);

    for (const token of tokens) {
      // 1. Newline
      if (token === "\n") {
        cursorX = 0;
        cursorY += lineHeight;
        continue;
      }

      // 2. Whitespace (Space, Tabs)
      if (token.match(/^\s+$/)) {
        if (cursorX === 0) continue; // Skip leading space on new line

        const width = spaceWidth * token.length;
        if (cursorX + width <= maxWidth) {
          cursorX += width;
        }
        // If space doesn't fit, we just ignore it; next word handles wrap
        continue;
      }

      // 3. Emoji
      if (token.startsWith("{") && token.endsWith("}")) {
        const key = token.slice(1, -1);
        const texture = this.emojis[key];

        if (texture) {
          const sprite = new Sprite(texture);
          const scale = fontSize / sprite.height;

          sprite.scale.set(scale);
          sprite.anchor.set(0, 0.1);

          // Wrap if needed
          if (cursorX + sprite.width > maxWidth && cursorX > 0) {
            cursorX = 0;
            cursorY += lineHeight;
          }

          sprite.position.set(cursorX, cursorY);
          this.contentContainer.addChild(sprite);
          cursorX += sprite.width + 2;
        }
        continue;
      }

      // 4. Word
      const wordText = new Text({ text: token, style: this._textStyle });
      const wordWidth = wordText.width;

      // Wrap if needed
      if (cursorX + wordWidth > maxWidth && cursorX > 0) {
        cursorX = 0;
        cursorY += lineHeight;
      }

      wordText.position.set(cursorX, cursorY);
      this.contentContainer.addChild(wordText);
      cursorX += wordWidth;
    }

    this._fullHeight = cursorY + lineHeight;
    this.drawBackground();
  }
}
