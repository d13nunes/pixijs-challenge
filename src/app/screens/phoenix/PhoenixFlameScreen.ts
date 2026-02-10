import { Container, DestroyOptions, Sprite, Ticker } from "pixi.js";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";
import { engine } from "../../getEngine";
import { MainScreen } from "../main/MainScreen";

type ParticleSprite = Sprite & {
  vx: number;
  vy: number;
  vr: number;
  fadeSpeed: number;
};

export class PhoenixFlameScreen extends Container {
  public static assetBundles = ["main"];
  private particles: ParticleSprite[] = [];
  private readonly DEFAULT_PARTICLES = 10;
  private particleCountLabel!: Label;
  private closeButton: Button;

  private screenW = 300;
  private screenH = 300;
  private particleStepper: Container;

  constructor() {
    super();
    this.particleStepper = new Container();
    this.closeButton = new Button({
      text: "X",
      width: 64,
      height: 64,
      fontSize: 24,
    });
    this.setupUI();
    this.startParticles();
  }

  private setupUI() {
    this.addChild(this.particleStepper);
    const btnMinus = new Button({ text: "-", width: 80, height: 60 });
    btnMinus.x = -120;
    btnMinus.onPress.connect(() => this.updateParticleCount(-1));
    this.particleStepper.addChild(btnMinus);
    this.particleCountLabel = new Label({
      text: "",
      style: { fill: 0xffffff, fontSize: 24 },
    });
    this.particleStepper.addChild(this.particleCountLabel);
    const btnPlus = new Button({ text: "+", width: 80, height: 60 });
    btnPlus.x = 120;
    btnPlus.onPress.connect(() => this.updateParticleCount(1));
    this.particleStepper.addChild(btnPlus);

    this.closeButton.onPress.connect(() =>
      engine().navigation.showScreen(MainScreen),
    );
    this.addChild(this.closeButton);
  }

  private async startParticles() {
    for (let i = 0; i < this.DEFAULT_PARTICLES; i++) {
      this.addParticle(true);
    }
  }

  init() {
    Ticker.shared.add(this.update, this);
  }

  public resize(width: number, height: number) {
    this.screenW = width;
    this.screenH = height;
    this.closeButton.x = this.screenW - 50;
    this.closeButton.y = 50;

    this.particleStepper.x = this.screenW / 2;
    this.particleStepper.y = this.closeButton.y + this.closeButton.height + 12;
  }

  public async show() {
    this.visible = true;
  }

  public async hide() {
    this.visible = false;
  }

  public update() {
    // Check if we are destroyed to stop leaking ticker
    if (this.destroyed) {
      Ticker.shared.remove(this.update, this);
      return;
    }

    for (const sprite of this.particles) {
      sprite.x += sprite.vx;
      sprite.y += sprite.vy;
      sprite.rotation += sprite.vr;
      sprite.alpha -= sprite.fadeSpeed;

      // Reset if invisible or too high up
      if (sprite.alpha <= 0 || sprite.y < 100) {
        this.resetParticle(sprite);
      }
    }
  }

  public destroy(options?: DestroyOptions | boolean) {
    Ticker.shared.remove(this.update, this);
    super.destroy(options);
  }

  private updateParticleCountLabel() {
    this.particleCountLabel.text = "Particles: " + this.particles.length;
  }
  private updateParticleCount(delta: number) {
    if (delta > 0) {
      this.addParticle();
    } else {
      this.removeParticle();
    }
    this.updateParticleCountLabel();
  }

  private addParticle(initial = false) {
    const sprite = Sprite.from("fire_particle.png") as ParticleSprite;
    sprite.anchor.set(0.5);
    sprite.blendMode = "add";
    this.resetParticle(sprite, initial);
    this.addChildAt(sprite, 0); // Add at bottom so UI is on top
    this.particles.push(sprite);
    this.updateParticleCountLabel();
  }

  private removeParticle() {
    if (this.particles.length > 0) {
      const sprite = this.particles.pop();
      if (sprite) {
        sprite.destroy();
      }
    }
  }

  private resetParticle(sprite: ParticleSprite, initial: boolean = false) {
    // Randomize start position
    sprite.x = this.screenW / 2 + (Math.random() - 0.5) * 100;

    if (initial) {
      sprite.y = this.screenH - Math.random() * this.screenH * 0.5;
      sprite.alpha = Math.random();
    } else {
      sprite.y = this.screenH + 50;
      sprite.alpha = 1;
    }

    // Random scale
    const scale = 0.1 + Math.random() * 0.5;
    sprite.scale.set(scale);
    // Random rotation speed data (storing on sprite for convenience, though strictly should use a separate data structure)
    sprite.vx = (Math.random() - 0.5) * 2;
    sprite.vy = -2 - Math.random() * 3;
    sprite.vr = (Math.random() - 0.5) * 0.1;
    sprite.fadeSpeed = 0.005 + Math.random() * 0.01;
  }
}
