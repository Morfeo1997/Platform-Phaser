import { Scene, Physics, GameObjects, Math as PMath } from 'phaser';

// ─── Tamaño del sprite de la estrella ────────────────────────────────────
const STAR_SIZE = 32;

// ─── Entidad StarGoal ─────────────────────────────────────────────────────
/**
 * Estrella de victoria pixel-art.
 * Flota con una animación suave y rota levemente.
 * Al superponerse con el jugador dispara el callback `onCollect`.
 *
 * Uso en GameScene:
 *   const star = new StarGoal(this, x, y, () => this.triggerVictory());
 *   this.physics.add.overlap(player.sprite, star.sensor, () => star.collect());
 */
export class StarGoal {
  /** Sprite visible de la estrella */
  readonly sprite: GameObjects.Image;
  /** Cuerpo estático invisible usado para el overlap con el jugador */
  readonly sensor: GameObjects.Rectangle & { body: Physics.Arcade.StaticBody };

  private collected = false;
  private floatTween!: Phaser.Tweens.Tween;
  private glowRing!: GameObjects.Graphics;
  private particles: GameObjects.Rectangle[] = [];
  private scene: Scene;
  private onCollect: () => void;

  constructor(scene: Scene, x: number, y: number, onCollect: () => void) {
    this.scene     = scene;
    this.onCollect = onCollect;

    StarGoal.generateTexture(scene);

    // Aro de brillo detrás de la estrella
    this.glowRing = scene.add.graphics();
    this.drawGlowRing(x, y, 0.6);

    // Sprite principal
    this.sprite = scene.add.image(x, y, 'star_goal').setDepth(5);

    // Sensor de colisión (rectángulo invisible)
    this.sensor = scene.add.rectangle(x, y, STAR_SIZE - 4, STAR_SIZE - 4, 0xffffff, 0) as
      GameObjects.Rectangle & { body: Physics.Arcade.StaticBody };
    scene.physics.add.existing(this.sensor, true);

    this.startAnimations(x, y);
    this.startParticleLoop(x, y);
  }

  // ── API pública ───────────────────────────────────────────────────────────

  /** Llama cuando el jugador toca el sensor. Idempotente. */
  collect() {
    if (this.collected) return;
    this.collected = true;
    this.playCollectAnimation();
    this.onCollect();
  }

  isCollected() { return this.collected; }

  // ─────────────────────────────────────────────────────────────────────────
  // GENERACIÓN DE TEXTURA (pixel-art, estática)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Dibuja una estrella de 5 puntas en pixel-art puro.
   * Usa fillTriangle en abanico desde el centro — sin fillPoints.
   */
  static generateTexture(scene: Scene) {
    if (scene.textures.exists('star_goal')) return;

    const S    = STAR_SIZE;
    const cx   = S / 2;
    const cy   = S / 2;
    const outerR = S / 2 - 1;
    const innerR = outerR * 0.42; // proporción clásica de estrella de 5 puntas
    const spikes = 5;

    const g = scene.add.graphics();

    // ── Sombra (desplazada 2px) ───────────────────────────────────────────
    g.fillStyle(0x000000, 0.3);
    for (let i = 0; i < spikes; i++) {
      const a0 = (i * 2 * Math.PI) / spikes - Math.PI / 2;
      const a1 = ((i + 0.5) * 2 * Math.PI) / spikes - Math.PI / 2;
      const a2 = ((i + 1) * 2 * Math.PI) / spikes - Math.PI / 2;
      g.fillTriangle(
        cx + 2, cy + 2,
        cx + 2 + Math.cos(a0) * outerR, cy + 2 + Math.sin(a0) * outerR,
        cx + 2 + Math.cos(a1) * innerR, cy + 2 + Math.sin(a1) * innerR,
      );
      g.fillTriangle(
        cx + 2, cy + 2,
        cx + 2 + Math.cos(a1) * innerR, cy + 2 + Math.sin(a1) * innerR,
        cx + 2 + Math.cos(a2) * outerR, cy + 2 + Math.sin(a2) * outerR,
      );
    }

    // ── Cuerpo dorado ────────────────────────────────────────────────────
    g.fillStyle(0xf5a623, 1);
    for (let i = 0; i < spikes; i++) {
      const a0 = (i * 2 * Math.PI) / spikes - Math.PI / 2;
      const a1 = ((i + 0.5) * 2 * Math.PI) / spikes - Math.PI / 2;
      const a2 = ((i + 1) * 2 * Math.PI) / spikes - Math.PI / 2;
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a0) * outerR, cy + Math.sin(a0) * outerR,
        cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR,
      );
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR,
        cx + Math.cos(a2) * outerR, cy + Math.sin(a2) * outerR,
      );
    }

    // ── Brillo interior (tono más claro, estrella interior pequeña) ───────
    g.fillStyle(0xffe566, 1);
    const innerOuter = outerR * 0.55;
    const innerInner = innerR * 0.55;
    for (let i = 0; i < spikes; i++) {
      const a0 = (i * 2 * Math.PI) / spikes - Math.PI / 2;
      const a1 = ((i + 0.5) * 2 * Math.PI) / spikes - Math.PI / 2;
      const a2 = ((i + 1) * 2 * Math.PI) / spikes - Math.PI / 2;
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a0) * innerOuter, cy + Math.sin(a0) * innerOuter,
        cx + Math.cos(a1) * innerInner, cy + Math.sin(a1) * innerInner,
      );
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a1) * innerInner, cy + Math.sin(a1) * innerInner,
        cx + Math.cos(a2) * innerOuter, cy + Math.sin(a2) * innerOuter,
      );
    }

    // ── Contorno pixel (1px, color oscuro) ───────────────────────────────
    // Dibujamos píxeles en las esquinas para dar sensación de contorno
    g.fillStyle(0xc47a00, 1);
    for (let i = 0; i < spikes; i++) {
      const a = (i * 2 * Math.PI) / spikes - Math.PI / 2;
      const px = Math.round(cx + Math.cos(a) * (outerR - 1));
      const py = Math.round(cy + Math.sin(a) * (outerR - 1));
      g.fillRect(px - 1, py - 1, 2, 2);
    }

    // ── Centro brillante ─────────────────────────────────────────────────
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(cx - 2, cy - 2, 4, 4);

    g.generateTexture('star_goal', S, S);
    g.destroy();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMACIONES IDLE
  // ─────────────────────────────────────────────────────────────────────────

  private drawGlowRing(x: number, y: number, alpha: number) {
    this.glowRing.clear();
    this.glowRing.lineStyle(3, 0xffe566, alpha);
    this.glowRing.strokeCircle(x, y, STAR_SIZE * 0.7);
    this.glowRing.lineStyle(1, 0xf5a623, alpha * 0.5);
    this.glowRing.strokeCircle(x, y, STAR_SIZE * 0.95);
  }

  private startAnimations(x: number, y: number) {
    // Flotación vertical
    this.floatTween = this.scene.tweens.add({
      targets:  this.sprite,
      y:        y + 8,
      duration: 1400,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });

    // El sensor sigue al sprite
    this.scene.tweens.add({
      targets:  this.sensor,
      y:        y + 8,
      duration: 1400,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      onUpdate: () => {
        (this.sensor.body as Physics.Arcade.StaticBody).reset(
          this.sensor.x,
          this.sensor.y,
        );
      },
    });

    // Rotación suave
    this.scene.tweens.add({
      targets:  this.sprite,
      angle:    15,
      duration: 1800,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });

    // Pulso del aro de brillo
    let ringAlpha = 0.6;
    let ringDir   = -1;
    this.scene.time.addEvent({
      delay:    50,
      loop:     true,
      callback: () => {
        if (this.collected) return;
        ringAlpha += ringDir * 0.04;
        if (ringAlpha <= 0.2 || ringAlpha >= 0.8) ringDir *= -1;
        this.drawGlowRing(this.sprite.x, this.sprite.y, ringAlpha);
      },
    });
  }

  private startParticleLoop(x: number, y: number) {
    const spawnParticle = () => {
      if (this.collected || !this.scene.scene.isActive()) return;

      const angle = PMath.FloatBetween(0, Math.PI * 2);
      const dist  = PMath.FloatBetween(STAR_SIZE * 0.4, STAR_SIZE * 0.9);
      const px    = x + Math.cos(angle) * dist;
      const py    = y + Math.sin(angle) * dist;
      const size  = PMath.Between(2, 4);
      const color = [0xf5a623, 0xffe566, 0xffffff][PMath.Between(0, 2)];

      const dot = this.scene.add.rectangle(px, py, size, size, color, 0.9).setDepth(4);
      this.particles.push(dot);

      this.scene.tweens.add({
        targets:  dot,
        x:        px + Math.cos(angle) * PMath.Between(10, 25),
        y:        py + Math.sin(angle) * PMath.Between(10, 25) - 10,
        alpha:    0,
        scaleX:   0,
        scaleY:   0,
        duration: PMath.Between(500, 900),
        ease:     'Power2',
        onComplete: () => {
          dot.destroy();
          this.particles = this.particles.filter(p => p !== dot);
        },
      });

      this.scene.time.delayedCall(PMath.Between(150, 350), spawnParticle);
    };

    this.scene.time.delayedCall(200, spawnParticle);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMACIÓN DE RECOLECCIÓN
  // ─────────────────────────────────────────────────────────────────────────

  private playCollectAnimation() {
    // Detener animaciones idle
    this.floatTween?.stop();
    this.glowRing.destroy();
    this.particles.forEach(p => p.destroy());
    this.particles = [];
    this.sensor.destroy();

    const cx = this.sprite.x;
    const cy = this.sprite.y;

    // La estrella escala y desaparece
    this.scene.tweens.add({
      targets:  this.sprite,
      scaleX:   2.5,
      scaleY:   2.5,
      alpha:    0,
      angle:    45,
      duration: 500,
      ease:     'Back.easeIn',
      onComplete: () => this.sprite.destroy(),
    });

    // Explosión de partículas doradas
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = PMath.Between(80, 200);
      const size  = PMath.Between(4, 8);
      const color = [0xf5a623, 0xffe566, 0xffffff, 0xff9500][PMath.Between(0, 3)];
      const dot   = this.scene.add.rectangle(cx, cy, size, size, color).setDepth(20);

      this.scene.tweens.add({
        targets:  dot,
        x:        cx + Math.cos(angle) * speed,
        y:        cy + Math.sin(angle) * speed - PMath.Between(20, 60),
        alpha:    0,
        scaleX:   0,
        scaleY:   0,
        duration: PMath.Between(500, 900),
        ease:     'Power2',
        onComplete: () => dot.destroy(),
      });
    }

    // Flash de pantalla
    const flash = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      this.scene.scale.width,
      this.scene.scale.height,
      0xffff00, 0.5,
    ).setDepth(30).setScrollFactor(0);

    this.scene.tweens.add({
      targets:  flash,
      alpha:    0,
      duration: 400,
      ease:     'Power2',
      onComplete: () => flash.destroy(),
    });
  }
}
