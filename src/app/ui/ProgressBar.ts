import { Container, Graphics, Sprite, Ticker } from "pixi.js";
import { Label } from "./Label";

export class ProgressBar extends Container {
    private _loadingWheel: Sprite;
    private _progressBar: Graphics;
    private _loadingLabel: Label;
    private _progress: number = 0;

    constructor(showLoadingText: boolean = false) {
        super();

        this._loadingWheel = Sprite.from("loading_wheel.png");
        this._loadingWheel.anchor.set(0.5);
        this.addChild(this._loadingWheel);

        this._progressBar = new Graphics();
        this.addChild(this._progressBar);

        // Send "Loading..." text
        this._loadingLabel = new Label({ text: "Loading...", style: { fill: 0xffffff, fontSize: 24 } });
        this.addChild(this._loadingLabel);
        this._loadingLabel.y = this._loadingWheel.height / 2 + 30;
        this._loadingLabel.visible = showLoadingText;

        // Center the progress bar below the wheel
        this._progressBar.y = this._loadingLabel.y + 30;


        // Start spinning
        Ticker.shared.add(this.update, this);
    }

    private update(ticker: Ticker) {
        this._loadingWheel.rotation += 0.1 * ticker.deltaTime;
    }

    public set progress(value: number) {
        this._progress = Math.max(0, Math.min(100, value));
        this.drawProgressBar();
    }

    private drawProgressBar() {
        const width = 300;
        const height = 20;
        const radius = 10;

        this._progressBar.clear();

        // Background
        this._progressBar.roundRect(-width / 2, 0, width, height, radius);
        this._progressBar.fill({ color: 0x3d3d3d, alpha: 0.5 });

        // Fill
        if (this._progress > 0) {
            const fillWidth = (width * this._progress) / 100;
            this._progressBar.roundRect(-width / 2, 0, fillWidth, height, radius);
            this._progressBar.fill({ color: 0xe72264, alpha: 0.8 });
        }
    }
}
