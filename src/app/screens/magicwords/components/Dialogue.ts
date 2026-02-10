import { Container, Texture, Assets } from "pixi.js";
import { Button } from "../../../ui/Button";
import {
  MagicDialogue,
  MagicEmoji,
  MagicAvatar,
  AvatarPosition,
} from "../models/types";
import { Avatar } from "./Avatar";
import { loadWithTimeoutMultiple } from "../../../utils/concurrency";
import { DialogBox } from "./DialogBox";

export class Dialogue extends Container {
  private _nextButton: Button;
  private _prevButton: Button;
  private _resetButton: Button;
  private _avatarTextures: Record<string, Texture> = {};
  private _emojis: Record<string, Texture> = {}; // Texture map
  private _currentIndex: number = 0;
  private dialogContainer: Container;

  private _width: number = 0;
  private _height: number = 0;

  private dialogues: MagicDialogue[] = [];
  private emojies: MagicEmoji[] = [];
  private avatars: MagicAvatar[] = [];

  private _dialogBox: DialogBox;
  private _avatar: Avatar;

  private isInitialized: boolean = false;

  private readonly yPadding = 18;

  constructor() {
    super();

    this.dialogContainer = new Container();
    this.dialogContainer.eventMode = "static";
    this.dialogContainer.cursor = "pointer";
    this.dialogContainer.on("pointerdown", () => {
      this.onTap();
    });
    this.addChild(this.dialogContainer);

    this._dialogBox = new DialogBox({
      fill: 0xffffff,
      fontSize: 26,
      wordWrap: true,
      wordWrapWidth: 500, // Explicit width for safety
    });
    this.dialogContainer.addChild(this._dialogBox);

    this._avatar = new Avatar();
    this._avatar.anchor.set(0.5, 1);
    this.dialogContainer.addChild(this._avatar);

    this._prevButton = new Button({ text: "Prev", width: 120, height: 70 });
    this._prevButton.onPress.connect(() => this.onPrev());
    this.addChild(this._prevButton);

    this._nextButton = new Button({ text: "Next", width: 120, height: 70 });
    this._nextButton.onPress.connect(() => this.onNext());
    this.addChild(this._nextButton);

    this._resetButton = new Button({ text: "Restart", width: 150, height: 70 });
    this._resetButton.onPress.connect(() => this.onReset());
    this.addChild(this._resetButton);
    this._resetButton.visible = false;

    this.visible = false;
  }

  public async init(
    dialogues: MagicDialogue[],
    emojies: MagicEmoji[],
    avatars: MagicAvatar[],
  ) {
    this.dialogues = dialogues;
    this.emojies = emojies;
    this.avatars = avatars;

    const avatarUrls = avatars.map((a) => a.url);
    const emojiUrls = emojies.map((e) => e.url);
    const loadOptions = {
      loadParser: "loadTextures",
      format: "png",
    };

    await loadWithTimeoutMultiple(
      [...avatarUrls, ...emojiUrls],
      loadOptions,
      3000, // timeout in ms
    );

    const placeholderTexture = await Assets.get("icon-question-mark.png");
    this._avatar.setPlaceholder(placeholderTexture);

    for (const avatar of this.avatars) {
      if (!this._avatarTextures[avatar.name]) {
        const texture = await Assets.get(avatar.url);
        this._avatarTextures[avatar.name] = texture;
      }
    }
    for (const emoji of this.emojies) {
      const texture = await Assets.get(emoji.url);
      if (texture) {
        this._emojis[emoji.name] = texture;
      }
    }

    this.isInitialized = true;
  }

  public start() {
    if (!this.isInitialized) {
      console.error("DialogueOverlay not initialized");
      return;
    }
    this._currentIndex = 0;
    this.visible = true;
    this.showStep(this._currentIndex);
    this.resize(this._width, this._height);
  }

  private showStep(index: number) {
    if (!this.isInitialized) {
      this.hide();
      return;
    }
    this._currentIndex = index;

    if (index >= this.dialogues.length) {
      this._resetButton.visible = true;
      this._prevButton.visible = false;
      this._nextButton.visible = false;
      this._dialogBox.visible = false;
      this._avatar.visible = false;
      this.resize(this._width, this._height);
      return;
    }

    this._resetButton.visible = false;
    this._prevButton.visible = index > 0;
    this._nextButton.visible = true;
    this._dialogBox.visible = true;
    this._avatar.visible = true;

    const step = this.dialogues[index];
    const avatarData = this.avatars.find((a) => a.name === step.name);
    const texture = avatarData ? this._avatarTextures[avatarData.name] : null;

    this._avatar.setAvatar(texture, step.name);
    this._dialogBox.show(step.text, this._emojis);

    this.resize(this._width, this._height);
  }

  private updateAvatarPosition() {
    if (this.dialogues.length === 0) return;
    const step = this.dialogues[this._currentIndex];
    const avatarData = this.avatars.find((a) => a.name === step.name);
    const isLeft = avatarData?.position === AvatarPosition.LEFT;
    const avatarBounds = this._avatar.getBounds();
    // Avatar stands on top of the dialog box
    this._avatar.y = this._dialogBox.y - avatarBounds.height / 2;
    if (isLeft) {
      this._avatar.x = avatarBounds.width / 2;
    } else {
      this._avatar.x = this.dialogContainer.width - avatarBounds.width / 2;
    }
  }

  private onTap() {
    if (this._dialogBox.isTyping) {
      this._dialogBox.finish();
    } else {
      this.onNext();
    }
  }

  private hide() {
    this.visible = false;
    this._currentIndex = 0;
  }

  private onNext() {
    if (this._currentIndex < this.dialogues.length) {
      this._currentIndex++;
      this.showStep(this._currentIndex);
    }
  }

  private onPrev() {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this.showStep(this._currentIndex);
    }
  }

  private onReset() {
    this._currentIndex = 0;
    this.showStep(this._currentIndex);
  }

  public resize(width: number, height: number) {
    this._width = width;
    this._height = height;

    this._resetButton.x = width / 2;
    this._resetButton.y = height / 2;

    if (this._currentIndex >= this.dialogues.length) {
      return;
    }

    const containerWidth = Math.min(600, Math.max(300, width * 0.9));
    this.dialogContainer.x = (width - containerWidth) / 2;

    // Buttons
    this._prevButton.x = this._prevButton.width / 2 + this.dialogContainer.x;
    this._prevButton.y = height - this.yPadding - this._prevButton.height / 2;
    this._nextButton.x =
      this.dialogContainer.x + containerWidth - this._nextButton.width / 2;
    this._nextButton.y = height - this.yPadding - this._nextButton.height / 2;

    const dialogMaxWidth = Math.min(600, width * 0.9);
    this._dialogBox.resize(dialogMaxWidth);
    const dialogBoxHeight = this._dialogBox.getBounds().height;
    const buttonTopY = this._nextButton.y - this._nextButton.height / 2;
    this._dialogBox.y = buttonTopY - dialogBoxHeight - 20;

    this.updateAvatarPosition();
  }
}
