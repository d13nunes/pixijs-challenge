import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import { Container } from "pixi.js";

import { engine } from "../../getEngine";
import { Button } from "../../ui/Button";

import { CardsScreen } from "../cards/CardsScreen";
import { PhoenixFlameScreen } from "../phoenix/PhoenixFlameScreen";
import { MagicWordsScreen } from "../magicwords/MagicWordsScreen";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  private showCardScreenButton: FancyButton;
  private showPhoenixFlameScreenButton: FancyButton;
  private showMagicWordsScreenButton: FancyButton;

  constructor() {
    super();
    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    this.showCardScreenButton = new Button({
      text: "Cards",
      width: 260,
      height: 120,
    });
    this.showCardScreenButton.onPress.connect(() =>
      engine().navigation.showScreen(CardsScreen),
    );
    this.addChild(this.showCardScreenButton);

    this.showPhoenixFlameScreenButton = new Button({
      text: "Phoenix Flame",
      width: 260,
      height: 120,
    });
    this.showPhoenixFlameScreenButton.onPress.connect(() =>
      engine().navigation.showScreen(PhoenixFlameScreen),
    );
    this.addChild(this.showPhoenixFlameScreenButton);

    this.showMagicWordsScreenButton = new Button({
      text: "Magic Words",
      width: 260,
      height: 120,
    });
    this.showMagicWordsScreenButton.onPress.connect(() =>
      engine().navigation.showScreen(MagicWordsScreen),
    );
    this.addChild(this.showMagicWordsScreenButton);
  }

  /** Fully reset */
  public reset() {}

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const totalButtonHeight =
      this.showCardScreenButton.height +
      this.showPhoenixFlameScreenButton.height +
      this.showMagicWordsScreenButton.height;
    const totalButtonSpacing = 20 * 2;

    this.showCardScreenButton.x = centerX;
    this.showCardScreenButton.y =
      centerY - totalButtonHeight * 0.5 - totalButtonSpacing * 0.5;
    this.showPhoenixFlameScreenButton.x = centerX;
    this.showPhoenixFlameScreenButton.y =
      centerY -
      totalButtonHeight * 0.5 -
      totalButtonSpacing * 0.5 +
      this.showCardScreenButton.height +
      20;
    this.showMagicWordsScreenButton.x = centerX;
    this.showMagicWordsScreenButton.y =
      centerY -
      totalButtonHeight * 0.5 -
      totalButtonSpacing * 0.5 +
      this.showCardScreenButton.height +
      20 +
      this.showPhoenixFlameScreenButton.height +
      20;
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    const elementsToAnimate = [
      this.showCardScreenButton,
      this.showPhoenixFlameScreenButton,
      this.showMagicWordsScreenButton,
    ];

    let finalPromise!: AnimationPlaybackControls;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.3, delay: 0.75, ease: "backOut" },
      );
    }

    await finalPromise;
  }

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {}
}
