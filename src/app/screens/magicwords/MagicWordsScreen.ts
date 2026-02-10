import { Container, Graphics } from "pixi.js";

import { Label } from "../../ui/Label";
import { Button } from "../../ui/Button";
import { ProgressBar } from "../../ui/ProgressBar";
import { MagicAvatar, MagicDialogue, MagicEmoji } from "./models/types";
import { Dialogue } from "./components/Dialogue";
import { engine } from "../../getEngine";
import { MainScreen } from "../main/MainScreen";

export class MagicWordsScreen extends Container {
  public static assetBundles = ["main"];
  private _background: Graphics;
  private _progressBar: ProgressBar;
  private _errorLabel: Label;
  private _retryButton: Button;
  private _closeButton: Button;
  private _dialogue: Dialogue;

  constructor() {
    super();

    this._background = new Graphics();
    this.addChild(this._background);

    this._progressBar = new ProgressBar(true);
    this._progressBar.visible = false;
    this.addChild(this._progressBar);

    this._errorLabel = new Label({
      text: "Error loading data.",
      style: { fill: 0xff0000, fontSize: 30 },
    });
    this._errorLabel.anchor.set(0.5);
    this._errorLabel.visible = false;
    this.addChild(this._errorLabel);

    this._retryButton = new Button({ text: "Retry" });
    this._retryButton.onPress.connect(() => this.loadData());
    this._retryButton.visible = false;
    this.addChild(this._retryButton);

    this._dialogue = new Dialogue();
    this.addChild(this._dialogue);

    this._closeButton = new Button({
      text: "X",
      width: 64,
      height: 64,
      fontSize: 24,
    });
    this._closeButton.onPress.connect(() =>
      engine().navigation.showScreen(MainScreen),
    );
    this.addChild(this._closeButton);
  }

  public async show() {
    this.visible = true;
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

    this._closeButton.x = width - 50;
    this._closeButton.y = 50;

    if (this._dialogue) {
      this._dialogue.resize(width, height);
    }
  }

  private async loadData() {
    this._progressBar.visible = true;
    this._errorLabel.visible = false;
    this._retryButton.visible = false;
    this._retryButton.visible = false;

    try {
      const response = await fetch(
        "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords",
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const responseData: {
        dialogue: MagicDialogue[];
        emojies: MagicEmoji[];
        avatars: MagicAvatar[];
      } = await response.json();
      await this._dialogue.init(
        responseData.dialogue,
        responseData.emojies,
        responseData.avatars,
      );
      this._dialogue.start();

      this._progressBar.visible = false;
    } catch (e) {
      console.error(e);
      this._progressBar.visible = false;
      this._errorLabel.visible = true;
      this._retryButton.visible = true;
    }
  }
}
