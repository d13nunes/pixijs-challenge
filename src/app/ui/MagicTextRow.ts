import { Container, Text, Sprite, Texture, Ticker } from "pixi.js";
import { EmojiMap } from "./EmojiMap";

export class MagicTextRow extends Container {
    private _width: number;

    constructor(text: string, maxWidth: number) {
        super();
        this._width = maxWidth;
        this.parseAndLayout(text);
    }

    private parseAndLayout(text: string): void {
        const tokens = text.split(/(\{[^}]+\})/g);
        let currentX = 0;
        let currentY = 0;
        const padding = 5;
        const lineHeight = 50; // Estimation, could be dynamic

        tokens.forEach((token) => {
            if (!token) return;

            let element: Container;

            if (EmojiMap[token]) {
                // It's an emoji
                const texture = Texture.from(EmojiMap[token]);
                const sprite = new Sprite(texture);
                sprite.anchor.set(0.5);
                sprite.scale.set(0.8); // Adjust scale as needed
                
                // Add bounce animation
                const randomOffset = Math.random() * 100;
                Ticker.shared.add((ticker) => {
                    const time = ticker.lastTime / 200 + randomOffset;
                    sprite.y = Math.sin(time) * 5 + sprite.height / 2; // Bounce around center
                });

                element = sprite;
                // Position adjustment for anchor 0.5
                element.y += sprite.height / 2;
            } else {
                // It's text
                const fontSize = Math.random() * 20 + 20; // 20 - 40
                const fill = Math.random() < 0.5 ? 0xffffff : 0xffff00; // Random color: white or yellow
                
                const style = {
                    fontFamily: "Arial Rounded MT Bold", // Use app font
                    fontSize: fontSize,
                    fill: fill,
                };
                
                const textObj = new Text({ text: token, style });
                textObj.anchor.set(0, 0.5); // Align left, middle to match sprite center vertically? No, baseline better? kept easy for now
                
                element = textObj;
                element.y += textObj.height / 2; // Center vertically in line
            }

            // Wrapping logic
            if (currentX + element.width > this._width && currentX > 0) {
                currentX = 0;
                currentY += lineHeight;
            }

            element.x = currentX + (element instanceof Sprite ? element.width/2 : 0); // specific offset for centered anchor
            element.y += currentY;

            this.addChild(element);
            currentX += element.width + padding;
        });
    }
}
