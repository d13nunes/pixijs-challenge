import { Container, Sprite, Ticker, Graphics } from "pixi.js";
import gsap from "gsap";
import { Button } from "../../ui/Button";
import { engine } from "../../getEngine";
import { MainScreen } from "../main/MainScreen";

export class CardsScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  /** Duration of the card movement animation in seconds */
  public animationDuration = 2;
  /** Interval between card moves in milliseconds */
  public moveInterval = 1000;
  private readonly xCardOffset = 0.025;
  private readonly yCardOffset = 0.25;
  private readonly cardCount = 144;

  private cards: Sprite[] = [];
  private stackA: Sprite[] = [];
  private stackB: Sprite[] = [];
  private timer: number | null = null;
  private appWidth: number = 0;
  private appHeight: number = 0;

  private background: Graphics;
  private cardsContainer: Container;
  private resetButton: Button;
  private closeButton: Button;
  private stackAOutline: Graphics;
  private stackBOutline: Graphics;

  constructor() {
    super();

    this.background = new Graphics();
    this.addChild(this.background);

    this.stackAOutline = new Graphics();
    this.addChild(this.stackAOutline);

    this.stackBOutline = new Graphics();
    this.addChild(this.stackBOutline);

    this.cardsContainer = new Container();
    this.addChild(this.cardsContainer);

    this.resetButton = new Button({
      text: "Reset",
      width: 150,
      height: 80,
      fontSize: 30,
    });
    this.resetButton.onPress.connect(() => this.prepare());
    this.addChild(this.resetButton);

    this.closeButton = new Button({
      text: "X",
      width: 64,
      height: 64,
      fontSize: 24,
    });
    this.closeButton.onPress.connect(() =>
      engine().navigation.showScreen(MainScreen),
    );
    this.addChild(this.closeButton);
  }

  /** Prepare the screen just before showing */
  public prepare() {
    this.cleanup();

    this.drawBackground();

    // Measure card size for outlines
    const tempCard = Sprite.from("card_back.png");
    tempCard.scale.set(2);
    const cardW = tempCard.width * 0.85;
    const cardH = tempCard.height * 1.2;

    // Draw outlines
    this.stackAOutline.clear();
    this.stackAOutline
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 16)
      .stroke({ width: 4, color: 0xffffff, alpha: 0.3 });

    this.stackBOutline.clear();
    this.stackBOutline
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 16)
      .stroke({ width: 4, color: 0xffffff, alpha: 0.3 });

    for (let i = 0; i < this.cardCount; i++) {
      const card = Sprite.from("card_back.png");

      card.anchor.set(0.5);
      card.scale.set(2); // Adjust scale if needed based on asset size
      card.tint = 0xcccccc; // Make it look like a card back

      this.cardsContainer.addChild(card);
      this.cards.push(card);
      this.stackA.push(card);
    }

    this.cardsContainer.sortableChildren = true;

    this.updateStackVisuals();

    // Start the timer to move cards
    this.timer = window.setInterval(() => {
      this.moveCard();
    }, this.moveInterval);
  }

  private cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Kill all tweens of cards
    this.cards.forEach((card) => gsap.killTweensOf(card));

    this.cardsContainer.removeChildren();
    this.cards = [];
    this.stackA = [];
    this.stackB = [];
  }

  private drawBackground() {
    this.background.clear();
    this.background.beginFill(0x355e3b); // Poker green
    this.background.drawRect(0, 0, this.appWidth, this.appHeight);
    this.background.endFill();
  }

  public resize(width: number, height: number) {
    this.appWidth = width;
    this.appHeight = height;

    this.drawBackground();

    // Reposition button
    this.resetButton.x = width * 0.5;
    this.resetButton.y = height - 100;

    this.closeButton.x = width - 50;
    this.closeButton.y = 50;

    this.updateStackVisuals(); // Re-layout stacks on resize
  }

  private updateStackVisuals() {
    // Determine positions based on layout
    let stackAX = 0,
      stackAY = 0;
    let stackBX = 0,
      stackBY = 0;
    stackAX = this.appWidth * 0.25;
    stackAY = this.appHeight * 0.5;

    stackBX = this.appWidth * 0.75;
    stackBY = this.appHeight * 0.5;

    // Position outlines
    this.stackAOutline.x = stackAX;
    this.stackAOutline.y = stackAY;
    this.stackBOutline.x = stackBX;
    this.stackBOutline.y = stackBY;

    // Position Stack A cards (only those currently IN stack A)
    // The requirement says: "Use a simple vertical and horizontal offset to create the 3D 'stacked' effect."
    this.stackA.forEach((card, index) => {
      // If card is currently animating, GSAP handles it.
      // But we need to define the "resting" position for cards in the stack.
      // Wait, if we use GSAP to move from A to B, we only need to set positions for static cards?
      // Actually, if we re-layout, we should probably update positions of cards that are NOT animating.
      // But for simplicity, let's just set them.

      if (!gsap.isTweening(card)) {
        card.x = stackAX + index * this.xCardOffset; // Simple offset
        card.y = stackAY - index * this.yCardOffset; // Simple offset
        card.zIndex = index;
      }
    });

    // Position Stack B cards
    this.stackB.forEach((card, index) => {
      if (!gsap.isTweening(card)) {
        card.x = stackBX + index * this.xCardOffset;
        card.y = stackBY - index * this.yCardOffset;
        // zIndex in stack B should also be ordered.
        // But visually, stack B grows.
        // If we move card from A to B, it goes to top of B.
        // So logic needs to be consistent.
        card.zIndex = index;
      }
    });
  }

  private moveCard() {
    if (this.stackA.length === 0) return;

    const card = this.stackA.pop();
    if (!card) return;

    // "Immediately upon starting the move, set the moving card's zIndex to a very high value"
    card.zIndex = 1000;

    // Determine target position in Stack B

    let stackBX = 0,
      stackBY = 0;

    stackBX = this.appWidth * 0.75;
    stackBY = this.appHeight * 0.5;

    // Offset based on strictly the new index in B
    // Wait, requirement: "x: targetStackX + (targetStackArray.length * 0.5)"
    // We push to stackB *after* animation or *before*?
    // "pop() it from the Stack A array. push() it into the Stack B array."
    // Doing it immediately helps with state management.
    this.stackB.push(card);
    const targetIndex = this.stackB.length;
    const targetX = stackBX + targetIndex * this.xCardOffset;
    const targetY = stackBY - targetIndex * this.yCardOffset;

    gsap.to(card, {
      x: targetX,
      y: targetY,
      zIndex: targetIndex,
      duration: this.animationDuration,
      ease: "power2.inOut",
      onUpdate: () => {
        // adjust for resize logic if needed, but keeping it simple for now
      },
      onComplete: () => {
        // "Update zIndex to its final position in the new stack"
      },
    });
  }

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    // Nothing to do here if GSAP handles animation
  }
}
