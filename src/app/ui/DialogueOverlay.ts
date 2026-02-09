import { Container, Graphics, Sprite, Text, TextStyle, Texture, Assets, FederatedPointerEvent } from "pixi.js";
import { Label } from "./Label";
import { Button } from "./Button";
import { MagicAvatar, MagicDialogue, MagicEmoji } from "../screens/magicwords/types";

export class DialogueOverlay extends Container {
    private _background: Graphics;
    private _dialogueBox: Graphics;
    private _nameLabel: Label;
    private _textContainer: Container;
    private _renderNodes: { type: 'text' | 'sprite', target: Text | Sprite, content?: string }[] = [];
    private _nextButton: Button;
    private _prevButton: Button;
    private _avatars: Record<string, Sprite> = {};
    private _emojis: Record<string, Texture> = {}; // Texture map
    private _currentAvatar: Sprite | null = null;
    private _currentIndex: number = 0;
    private _isTyping: boolean = false;
    private _fullText: string = "";
    private _displayEmojiName: string | null = null;
    private _typewriterTimer: any = null;
    private _tapOverlay: Graphics;
    private _emojiSprite: Sprite;
    private _width: number = 0;
    private _height: number = 0;

    private dialogues: MagicDialogue[] = [];
    private emojies: MagicEmoji[] = [];
    private avatars: MagicAvatar[] = [];

    private isInitialized: boolean = false;

    constructor() {
        super();

        // Background - modal dim
        this._background = new Graphics();
        this._background.alpha = 0.5;
        this.addChild(this._background);

        // Tap area to advance dialogue
        this._tapOverlay = new Graphics();
        this._tapOverlay.eventMode = 'static';
        this._tapOverlay.cursor = 'pointer';
        this._tapOverlay.on('pointerdown', (e: FederatedPointerEvent) => {
            // Stop propagation if necessary, but here we just want to catch taps
            this.onTap();
        });
        this.addChild(this._tapOverlay);

        // Dialogue Box background
        this._dialogueBox = new Graphics();
        this.addChild(this._dialogueBox);

        // Name Label
        this._nameLabel = new Label({ text: "", style: { fill: 0xFFFFFF, fontSize: 24, fontWeight: 'bold' } });
        this.addChild(this._nameLabel);

        // Text content container
        this._textContainer = new Container();
        this.addChild(this._textContainer);

        this._prevButton = new Button({ text: "Prev", width: 100, height: 50 });
        this._prevButton.onPress.connect(() => this.onPrev());
        this.addChild(this._prevButton);

        this._nextButton = new Button({ text: "Next", width: 100, height: 50 });
        this._nextButton.onPress.connect(() => this.onNext());
        this.addChild(this._nextButton);

        // Emoji Sprite
        this._emojiSprite = new Sprite();
        this._emojiSprite.anchor.set(0.5);
        this._emojiSprite.visible = false;
        this.addChild(this._emojiSprite);

        this.visible = false;
    }

    public async init(dialogues: MagicDialogue[], emojies: MagicEmoji[], avatars: MagicAvatar[]) {
        this.dialogues = dialogues;
        this.emojies = emojies;
        this.avatars = avatars;

        // Load Avatars
        for (const avatar of this.avatars) {
            if (!this._avatars[avatar.name]) {
                console.log("Loading avatar: ", avatar.url);
                const texture = await Assets.load({
                    src: avatar.url,
                    loadParser: 'loadTextures',
                    format: 'png'
                });
                console.log("Loaded avatar: ", texture);
                const sprite = new Sprite(texture);
                sprite.anchor.set(0.5, 1); // Anchor bottom center
                sprite.visible = false;
                this._avatars[avatar.name] = sprite;
                this.addChild(sprite); // Add to container but hidden
            }
        }

        // Load Emojis
        for (const emoji of this.emojies) {
            if (!this._emojis[emoji.name]) {
                try {
                    const texture = await Assets.load({
                        src: emoji.url,
                        loadParser: 'loadTextures',
                        format: 'png'
                    });
                    this._emojis[emoji.name] = texture;
                } catch (e) {
                    console.error(`Failed to load emoji: ${emoji.name}`, e);

                }
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
    }

    private showStep(index: number) {
        if (!this.isInitialized || index >= this.dialogues.length) {
            this.hide();
            return;
        }

        const step = this.dialogues[index];
        const avatarData = this.avatars.find(a => a.name === step.name);

        // Hide all avatars
        Object.values(this._avatars).forEach(s => s.visible = false);

        // Show current avatar
        if (avatarData && this._avatars[step.name]) {
            const avatar = this._avatars[step.name];
            // Ensure avatar is behind the dialogue box visually. 
            // Since we added avatars in init, and box in constructor, mapped sprites might be on top.
            // We should use zIndex or sort. 
            // Simple fix: remove and re-add dialogue box + text on top, OR create layers.
            // For now, let's just use setChildIndex.

            this.setChildIndex(avatar, this.getChildIndex(this._background) + 1); // Just above background

            avatar.visible = true;
            this._currentAvatar = avatar;

            this.updateAvatarPosition(avatarData);
        }

        this._nameLabel.text = step.name;

        this.parseAndLayout(step.text);

        this._isTyping = true;
        this.startTypewriter();
    }

    private parseAndLayout(fullText: string) {
        this._textContainer.removeChildren();
        this._renderNodes = [];

        // Split by {emoji} tags but keep delimiters
        // Regex to match {emoji}
        const tokens = fullText.split(/(\{.*?\})/g);

        const maxWidth = this._width - 180; // Padding
        let currentX = 0;
        let currentY = 0;
        const lineHeight = 30;
        const style = new TextStyle({
            fill: 0xFFFFFF,
            fontSize: 20,
        });

        tokens.forEach(token => {
            if (!token) return;

            const emojiMatch = token.match(/^\{([a-zA-Z0-9_]+)\}$/);
            if (emojiMatch) {
                // It is an emoji
                const emojiName = emojiMatch[1];
                if (this._emojis[emojiName]) {
                    const sprite = new Sprite(this._emojis[emojiName]);
                    sprite.anchor.set(0, 0.2); // Align somewhat with text baseline
                    sprite.scale.set(0.6); // Scale to fit text size roughly
                    const width = sprite.width;

                    if (currentX + width > maxWidth) {
                        currentX = 0;
                        currentY += lineHeight;
                    }

                    sprite.position.set(currentX, currentY);
                    sprite.visible = false; // Start hidden
                    this._textContainer.addChild(sprite);
                    this._renderNodes.push({ type: 'sprite', target: sprite });

                    currentX += width + 5; // spacing
                }
            } else {
                // It is text. Split by words to handle wrapping
                const words = token.split(/(\s+)/g); // split by whitespace, keep delimiter

                words.forEach(word => {
                    if (!word) return;

                    // temporary text to measure
                    // We could use TextMetrics but creating Text objects is easier for rendering 
                    // To optimize we could use a single Text object per line, but for typewriter word-by-word or char-by-char, 
                    // separate objects or updating a single object is tricky with mixed sprites.
                    // Simplest for now: One Text object per word? Or per segment?
                    // Let's do One Text object per word to allow wrapping.
                    // Actually, if we want character-by-character typewriter within a word, 
                    // we need the text object to contain the full word but be revealed slowly.

                    const wordText = new Text({ text: word, style });
                    const width = wordText.width;

                    if (currentX + width > maxWidth) {
                        currentX = 0;
                        currentY += lineHeight;
                    }

                    wordText.position.set(currentX, currentY);
                    wordText.text = ""; // Start empty
                    this._textContainer.addChild(wordText);
                    this._renderNodes.push({ type: 'text', target: wordText, content: word });

                    currentX += width;
                    // If word was just space, we might want to check if it fits at end of line... 
                    // but simple logic matches standard wrapping roughly
                });
            }
        });
    }

    private updateAvatarPosition(avatarData: MagicAvatar) {
        const sprite = this._avatars[avatarData.name];
        if (!sprite) return; // Should exist

        const boxHeight = 250;
        sprite.y = this._height - boxHeight + 20; // Slightly behind box
        sprite.scale.set(0.8); // Scale down a bit if needed

        if (avatarData.position === 'left') {
            sprite.x = this._width * 0.25;
            // Ensure facing right (default?)
            if (sprite.scale.x < 0) sprite.scale.x *= -1;
        } else {
            sprite.x = this._width * 0.75;
            // Flip to face left? Usually characters face center.
            if (sprite.scale.x > 0) sprite.scale.x *= -1;
        }
    }

    private startTypewriter() {
        if (this._typewriterTimer) clearInterval(this._typewriterTimer);

        let nodeIndex = 0;
        let charIndex = 0;

        this._typewriterTimer = setInterval(() => {
            if (!this._isTyping) return;
            if (nodeIndex >= this._renderNodes.length) {
                this.finishTypewriter();
                return;
            }

            const node = this._renderNodes[nodeIndex];

            if (node.type === 'sprite') {
                node.target.visible = true;
                nodeIndex++;
                charIndex = 0;
            } else if (node.type === 'text') {
                const fullContent = node.content || "";
                charIndex++;
                (node.target as Text).text = fullContent.substring(0, charIndex);
                if (charIndex >= fullContent.length) {
                    nodeIndex++;
                    charIndex = 0;
                }
            }
        }, 30); // 30ms per char
    }

    private finishTypewriter() {
        this._isTyping = false;
        if (this._typewriterTimer) clearInterval(this._typewriterTimer);

        // Show everything
        this._renderNodes.forEach(node => {
            if (node.type === 'sprite') {
                node.target.visible = true;
            } else {
                (node.target as Text).text = node.content || "";
            }
        });
    }

    private onTap() {
        if (this._isTyping) {
            this.finishTypewriter();
        } else {
            this._currentIndex++;
            this.showStep(this._currentIndex);
        }
    }

    private hide() {
        this.visible = false;
        // Reset state
        this._currentIndex = 0;
        // cleanup?
    }

    private onNext() {
        this.onTap(); // Same logic as tap
    }

    private onPrev() {
        if (this._currentIndex > 0) {
            this._currentIndex--;
            this.showStep(this._currentIndex);
        }
    }

    public resize(width: number, height: number) {
        this._width = width;
        this._height = height;

        this._background.clear();
        this._background.rect(0, 0, width, height);
        this._background.fill(0x000000); // Overlay dim

        this._tapOverlay.clear();
        this._tapOverlay.rect(0, 0, width, height);
        this._tapOverlay.fill({ color: 0x000000, alpha: 0.001 }); // Capture clicks

        const boxHeight = 250;
        const boxY = height - boxHeight;

        this._dialogueBox.clear();
        this._dialogueBox.roundRect(40, boxY, width - 80, boxHeight - 40, 20);
        this._dialogueBox.fill({ color: 0x222222, alpha: 0.95 });
        this._dialogueBox.stroke({ width: 4, color: 0xffd700 }); // Gold border

        // Label Positions
        this._nameLabel.position.set(70, boxY + 20);
        this._textContainer.position.set(70, boxY + 70);

        // Rerender layout if data exists (needed for responsiveness)
        if (this._dialogueBox.width > 0 && this.isInitialized && this.visible) {
            // Re-layout current step to fit new width
            // But parseAndLayout resets typing.
            // Ideally we just reposition. But wrapping changes.
            // For now, let's just finish typewriter if resizing to avoid complexity
            if (this.visible && this.dialogues[this._currentIndex]) {
                this.parseAndLayout(this.dialogues[this._currentIndex].text);
                this.finishTypewriter();
            }
        }

        // Re-position current avatar if active
        if (this._currentAvatar && this.isInitialized) {
            const data = this.avatars.find(a => a.name === this._nameLabel.text);
            if (data) this.updateAvatarPosition(data);
        }



        // Position Buttons
        this._prevButton.x = 80;
        this._prevButton.y = height - 40;

        this._nextButton.x = width - 80;
        this._nextButton.y = height - 40;
    }
}
