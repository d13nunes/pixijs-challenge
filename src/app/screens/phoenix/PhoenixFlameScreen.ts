import { Container, Sprite, Ticker } from "pixi.js";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";

export class PhoenixFlameScreen extends Container {
  public static assetBundles = ["main"];
  private particles: Sprite[] = [];
  private readonly DEFAULT_PARTICLES = 10;
  private particleCountLabel!: Label;

  private screenW = 300;
  private screenH = 300;
  private particleStepper: Container;

  constructor() {
    super();
    this.particleStepper = new Container();
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
    this.particleStepper.x = this.screenW / 2;
    this.particleStepper.y = 80;
  }

  public async show() {
    this.visible = true;
  }

  public async hide() {
    this.visible = false;
  }

  public update(_ticker: Ticker) {
    // Check if we are destroyed to stop leaking ticker
    if (this.destroyed) {
      Ticker.shared.remove(this.update, this);
      return;
    }

    for (const sprite of this.particles) {
      sprite.x += (sprite as any).vx;
      sprite.y += (sprite as any).vy;
      sprite.rotation += (sprite as any).vr;
      sprite.alpha -= (sprite as any).fadeSpeed;

      // Reset if invisible or too high up
      if (sprite.alpha <= 0 || sprite.y < 100) {
        this.resetParticle(sprite);
      }
    }
  }

  public destroy(options?: any) {
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
    const sprite = Sprite.from("fire_particle.png");
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

  private resetParticle(sprite: Sprite, initial: boolean = false) {
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
    (sprite as any).vx = (Math.random() - 0.5) * 2;
    (sprite as any).vy = -2 - Math.random() * 3;
    (sprite as any).vr = (Math.random() - 0.5) * 0.1;
    (sprite as any).fadeSpeed = 0.005 + Math.random() * 0.01;
  }

}