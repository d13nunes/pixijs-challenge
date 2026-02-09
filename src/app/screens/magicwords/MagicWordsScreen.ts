import { Container, Graphics, Ticker } from "pixi.js";


import { Label } from "../../ui/Label";
import { Button } from "../../ui/Button";
import { ProgressBar } from "../../ui/ProgressBar";
import { MagicAvatar, MagicDialogue, MagicEmoji } from "./types";
import { DialogueOverlay } from "../../ui/DialogueOverlay";

export class MagicWordsScreen extends Container {
    public static assetBundles = ["main"];

    private _background: Graphics;
    private _progressBar: ProgressBar;
    private _errorLabel: Label;
    private _retryButton: Button;
    private _dialogueOverlay: DialogueOverlay;





    constructor() {
        super();

        this._background = new Graphics();
        this.addChild(this._background);




        this._progressBar = new ProgressBar(true);
        this._progressBar.visible = false;
        this.addChild(this._progressBar);

        this._errorLabel = new Label({ text: "Error loading data.", style: { fill: 0xff0000, fontSize: 30 } });
        this._errorLabel.anchor.set(0.5);
        this._errorLabel.visible = false;
        this.addChild(this._errorLabel);

        this._retryButton = new Button({ text: "Retry" });
        this._retryButton.onPress.connect(() => this.loadData());
        this._retryButton.visible = false;
        this.addChild(this._retryButton);

        this._dialogueOverlay = new DialogueOverlay();
        this.addChild(this._dialogueOverlay);
    }

    public async show() {
        this.visible = true;
        this.visible = true;
        if (!this._dialogueOverlay) {
        // wait for init? Actually we init in loadData
        }
        // Always try to load if not loaded? Or check flag?
        // Using a flag "loaded" would be better but let's just call loadData if overlay is not started or empty
        // logic was: if (this._rows.length === 0).
        // New logic: just call loadData if we haven't yet?
        // Or better, add a flag isLoaded
        this.loadData();
    }

    public async hide() {
        this.visible = false;
    }

    public resize(width: number, height: number) {
        this._background.clear();
        this._background.rect(0, 0, width, height);
        this._background.fill(0x2c3e50);

        this._progressBar.position.set(width / 2, height / 2);
        this._errorLabel.position.set(width / 2, height / 2 - 40);
        this._retryButton.x = width / 2;
        this._retryButton.y = height / 2 + 40;

        if (this._dialogueOverlay) {
            this._dialogueOverlay.resize(width, height);
        }



    }

    private async loadData() {
        this._progressBar.visible = true;
        this._errorLabel.visible = false;
        this._retryButton.visible = false;
        this._retryButton.visible = false;

        try {
            const response = await fetch("https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords");
            if (!response.ok) throw new Error("Network response was not ok");
            const responseData: { dialogue: MagicDialogue[], emojies: MagicEmoji[], avatars: MagicAvatar[] } = await response.json();
            await this._dialogueOverlay.init(responseData.dialogue, responseData.emojies, responseData.avatars);
            this._dialogueOverlay.start();

            this._progressBar.visible = false;
        } catch (e) {
            console.error(e);
            this._progressBar.visible = false;
            this._errorLabel.visible = true;
            this._retryButton.visible = true;
        }
    }


}
