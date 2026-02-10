import {
  Container,
  DestroyOptions,
  Graphics,
  TextStyle,
  TextStyleOptions,
  Ticker,
  Text,
  Sprite,
  Texture,
} from "pixi.js";

type RenderNode = {
  type: "text" | "sprite";
  target: Text | Sprite;
  content?: string; // For text nodes, the full text

  // For typewriter effect
  startIndex: number; // The global index where this node starts
  endIndex: number; // The global index where this node ends
};

export class DialogBoxTypewrite extends Container {
  private _textStyle: TextStyle;
  private bg: Graphics;
  private contentContainer: Container;

  private speed: number;
  private index: number;
  private fullLength: number = 0; // Total length in "characters" (sprites count as 1)
  private fullText: string;
  private emojis: Record<string, Texture>;
  public get fullHeight() {
    return this._fullHeight + 40;
  } // + padding
  private _fullHeight: number = 0;

  private nodes: RenderNode[] = [];
  private _isTyping: boolean = false;

  public get isTyping() {
    return this._isTyping;
  }

  constructor(style: TextStyleOptions) {
    super();
    this.fullText = "";
    this.emojis = {};

    this._textStyle = new TextStyle({
      ...style,
      wordWrap: true,
      breakWords: true, // Word wrap within the Text node itself if needed, though we split by words usually
      wordWrapWidth: 100, // Initial default, will be overridden
    });

    // 1. The Background
    this.bg = new Graphics();
    this.addChild(this.bg);

    // 2. The Content Container
    this.contentContainer = new Container();

    this.contentContainer.position.set(20, 20); // 20px padding
    this.addChild(this.contentContainer);

    this.speed = 0.025; // Characters per ms
    this.index = 0;
  }

  /**
   * Show a message with optional emojis.
   * @param message Text with {key} placeholders
   * @param animate Whether to use typewriter effect
   * @param emojis Map of emoji keys to Textures
   */
  show(
    message: string,
    emojis: Record<string, Texture> = {},
    animate: boolean = true,
  ) {
    this.fullText = message;
    this.emojis = emojis;
    Ticker.shared.remove(this.onUpdate, this);

    this.layout(message, emojis);
    this.drawBackground();

    this.index = 0;

    if (animate) {
      this._isTyping = true;
      this.updateVisibility(0); // Hide everything initially
      Ticker.shared.add(this.onUpdate, this);
    } else {
      this.finish();
    }
  }

  finish() {
    Ticker.shared.remove(this.onUpdate, this);
    this.index = this.fullLength;
    this.updateVisibility(this.fullLength);
    this._isTyping = false;
  }

  private onUpdate = (ticker: Ticker) => {
    this.index += this.speed * ticker.deltaMS;

    this.updateVisibility(this.index);

    if (this.index >= this.fullLength) {
      this.finish();
    }
  };

  private updateVisibility(currentIndex: number) {
    // Go through nodes and set visible / text
    for (const node of this.nodes) {
      if (currentIndex >= node.endIndex) {
        // Fully visible
        node.target.visible = true;
        if (node.type === "text") {
          (node.target as Text).text = node.content!;
        }
      } else if (currentIndex > node.startIndex) {
        // Partially visible
        node.target.visible = true;
        if (node.type === "text") {
          const localIndex = Math.floor(currentIndex - node.startIndex);
          (node.target as Text).text = node.content!.slice(0, localIndex);
        }
      } else {
        // Not visible yet
        node.target.visible = false;
        if (node.type === "text") {
          (node.target as Text).text = "";
        }
      }
    }
  }

  private lastWidth: number = 400; // Default

  resize(targetWidth: number) {
    this.lastWidth = targetWidth;
    this.layout(this.fullText, this.emojis);
    this.contentContainer.position.set(20, 20);

    this.drawBackground();
  }

  private drawBackground() {
    const height = this.fullHeight;
    const width = this.lastWidth;

    this.bg
      .clear()
      .roundRect(0, 0, width, height, 15)
      .fill({ color: 0x1a1a1a, alpha: 0.9 })
      .stroke({ width: 2, color: 0xffffff, alpha: 1 });
  }

  private layout(fullText: string, emojis: Record<string, Texture>) {
    if (!fullText) return;
    // Clear previous
    this.contentContainer.removeChildren();
    this.nodes = [];

    const padding = 40;
    const maxWidth = this.lastWidth - padding;

    // Safety check for layout width
    if (maxWidth <= 0) return;

    let currentX = 0;
    let currentY = 0;

    // Calculate metrics
    const tempText = new Text({ text: "M", style: this._textStyle });
    const lineHeight = tempText.height;
    // Measure space width accurately
    const spaceText = new Text({ text: ". .", style: this._textStyle });
    const dotText = new Text({ text: "..", style: this._textStyle });
    const spaceWidth = spaceText.width - dotText.width; // Hack to measure space

    tempText.destroy();
    spaceText.destroy();
    dotText.destroy();

    const fontSize =
      typeof this._textStyle.fontSize === "number"
        ? this._textStyle.fontSize
        : 20;

    // Style for words - disable internal wrapping to prevent layout issues
    const wordStyle = new TextStyle({
      ...this._textStyle.clone(),
      wordWrap: false,
    });

    // Split by emoji tags
    const tokens = fullText.split(/(\{.*?\})/g);

    let globalIndex = 0;

    tokens.forEach((token) => {
      if (!token) return;

      const emojiMatch = token.match(/^\{([a-zA-Z0-9_]+)\}$/);
      if (emojiMatch) {
        // It is an emoji
        const emojiName = emojiMatch[1];
        const texture = emojis[emojiName];

        if (texture) {
          const sprite = new Sprite(texture);
          sprite.anchor.set(0, 0.1); // Align somewhat with text baseline
          const emojiScale = fontSize / sprite.height;
          sprite.scale.set(emojiScale);

          const width = sprite.width;

          // Wrap if needed
          if (currentX + width > maxWidth) {
            currentX = 0;
            currentY += lineHeight;
          }

          sprite.position.set(currentX, currentY);
          sprite.visible = false;
          this.contentContainer.addChild(sprite);

          this.nodes.push({
            type: "sprite",
            target: sprite,
            startIndex: globalIndex,
            endIndex: globalIndex + 1,
          });

          currentX += width + 2; // small spacing
          globalIndex += 1; // Emojis count as 1 character unit for typewriter speed
        }
      } else {
        // Text: split by words to handle wrapping
        const words = token.split(/(\s+)/g);

        words.forEach((word) => {
          if (!word) return;

          if (word.match(/^\s+$/)) {
            // It's a space/whitespace
            if (currentX === 0) return; // Skip leading space on line

            const width = spaceWidth * word.length;

            // If space fits, add it. If not, ignore it (wrap happens on next word)
            if (currentX + width <= maxWidth) {
              currentX += width;
            }
            globalIndex += word.length;
            return;
          }

          const wordText = new Text({ text: word, style: wordStyle });
          const width = wordText.width;

          // Wrap if needed
          if (currentX + width > maxWidth && currentX > 0) {
            currentX = 0;
            currentY += lineHeight;
          }

          wordText.position.set(currentX, currentY);
          wordText.visible = false;
          this.contentContainer.addChild(wordText);

          const length = word.length;

          this.nodes.push({
            type: "text",
            target: wordText,
            content: word,
            startIndex: globalIndex,
            endIndex: globalIndex + length,
          });

          currentX += width;
          globalIndex += length;
        });
      }
    });

    this.fullLength = globalIndex;
    this._fullHeight = currentY + lineHeight;
  }

  public override destroy(options?: DestroyOptions | boolean) {
    Ticker.shared.remove(this.onUpdate, this);
    super.destroy(options);
  }
}
