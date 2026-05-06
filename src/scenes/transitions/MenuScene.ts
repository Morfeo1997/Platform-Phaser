import { Scene, GameObjects, Math as PMath } from 'phaser';

// ─── Paleta compartida (importá esto de un constants.ts si crece) ──────────
export const PALETTE = {
  bg1:     0x1a1a2e,
  bg2:     0x0f3460,
  accent:  0x4ecdc4,
  red:     0xe94560,
  gold:    0xf5a623,
  dark:    0x0d0d1a,
  white:   0xffffff,
} as const;

// ─── Escena ────────────────────────────────────────────────────────────────
export class MenuScene extends Scene {

  // Referencias para poder animar / limpiar en shutdown
  private titleText!:    GameObjects.Text;
  private subtitleText!: GameObjects.Text;
  private stars: GameObjects.Rectangle[] = [];
  private floatingParticles: GameObjects.Rectangle[] = [];

  constructor() { super({ key: 'MenuScene' }); }

  // ── create ───────────────────────────────────────────────────────────────
  create() {
    const { width, height } = this.scale;
    const cx = width  / 2;
    const cy = height / 2;

    this.createBackground(width, height);
    this.createStars(width, height);
    this.createTitle(cx);
    this.createButtons(cx, cy, width);
    this.createVersion(width, height);
    this.startParticleLoop(width, height);
  }

  // ── shutdown ─────────────────────────────────────────────────────────────
  shutdown() {
    // Phaser destruye los GameObjects de la escena automáticamente,
    // pero detenemos tweens que apunten a ellos para evitar errores.
    this.tweens.killAll();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTRUCCIÓN DE LA PANTALLA
  // ─────────────────────────────────────────────────────────────────────────

  private createBackground(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.bg1, PALETTE.bg1, PALETTE.bg2, PALETTE.dark, 1);
    bg.fillRect(0, 0, width, height);

    // Línea de horizonte sutil
    bg.lineStyle(1, PALETTE.accent, 0.15);
    bg.lineBetween(0, height * 0.72, width, height * 0.72);

    // Suelo pixel-art
    bg.fillStyle(PALETTE.dark, 0.6);
    bg.fillRect(0, height * 0.72, width, height * 0.28);
  }

  private createStars(width: number, height: number) {
    for (let i = 0; i < 80; i++) {
      const x     = PMath.Between(0, width);
      const y     = PMath.Between(0, height * 0.7);
      const size  = Math.random() < 0.2 ? 2 : 1;
      const alpha = PMath.FloatBetween(0.3, 1);

      const star = this.add.rectangle(x, y, size, size, PALETTE.white, alpha);
      this.stars.push(star);

      // Parpadeo
      this.tweens.add({
        targets: star,
        alpha: PMath.FloatBetween(0.1, 0.4),
        duration: PMath.Between(1200, 3500),
        yoyo: true,
        repeat: -1,
        delay: PMath.Between(0, 2000),
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createTitle(cx: number) {
    // Sombra del título
    this.add.text(cx + 4, 80 + 4, 'PIXEL QUEST', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '36px',
      color:      '#000000',
      alpha:      0.5,
    }).setOrigin(0.5, 0);

    // Título principal
    this.titleText = this.add.text(cx, 80, 'PIXEL QUEST', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '36px',
      color:      '#f5a623',
      stroke:     '#e94560',
      strokeThickness: 6,
    }).setOrigin(0.5, 0).setAlpha(0);

    // Subtítulo
    this.subtitleText = this.add.text(cx, 140, 'La aventura comienza', {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#4ecdc4',
      letterSpacing: 4,
    }).setOrigin(0.5, 0).setAlpha(0);

    // Entrada con fade + bounce del título
    this.tweens.add({
      targets:  this.titleText,
      alpha:    1,
      y:        { from: 50, to: 80 },
      duration: 800,
      ease:     'Back.easeOut',
    });

    this.tweens.add({
      targets:  this.subtitleText,
      alpha:    1,
      duration: 600,
      delay:    400,
      ease:     'Power2',
    });

    // Flotación suave del título
    this.tweens.add({
      targets:  this.titleText,
      y:        '+=8',
      duration: 2000,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      delay:    900,
    });
  }

  private createButtons(cx: number, cy: number, width: number) {
    // Botón: Jugar
    this.createButton(
      cx,
      cy + 20,
      width * 0.45,
      54,
      '▶  JUGAR',
      PALETTE.accent,
      0.7,
      () => this.startGame(),
    );

    // Botón: Seleccionar nivel
    this.createButton(
      cx,
      cy + 90,
      width * 0.45,
      54,
      '☰  SELECCIONAR NIVEL',
      PALETTE.red,
      0.7,
      () => this.goToLevelSelect(),
    );
  }

  /**
   * Crea un botón pixel-art reutilizable.
   * @param x        Centro X
   * @param y        Centro Y
   * @param w        Ancho
   * @param h        Alto
   * @param label    Texto del botón
   * @param color    Color principal (hex)
   * @param delay    Delay de entrada en segundos
   * @param onPress  Callback al hacer click
   */
  private createButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    delay: number,
    onPress: () => void,
  ) {
    // Contenedor para mover todo junto
    const container = this.add.container(x, y).setAlpha(0);

    // Sombra
    const shadow = this.add.rectangle(3, 4, w, h, 0x000000, 0.5);
    // Fondo del botón
    const bg     = this.add.rectangle(0, 0, w, h, color, 0.15);
    // Borde
    const border = this.add.rectangle(0, 0, w, h).setStrokeStyle(2, color, 1).setFillStyle();
    // Línea superior (efecto pixel bevel)
    const bevel  = this.add.rectangle(0, -(h / 2) + 2, w - 4, 2, color, 0.5);
    // Texto
    const text   = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize:   '13px',
      color:      '#ffffff',
      letterSpacing: 1,
    }).setOrigin(0.5, 0.5);

    container.add([shadow, bg, border, bevel, text]);

    // Animación de entrada
    this.tweens.add({
      targets:  container,
      alpha:    1,
      x:        { from: x - 30, to: x },
      duration: 500,
      delay:    delay * 1000,
      ease:     'Back.easeOut',
    });

    // Interactividad
    const hitArea = this.add.rectangle(x, y, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: container, scaleX: 1.04, scaleY: 1.04,
        duration: 120, ease: 'Power1',
      });
      bg.setFillStyle(color, 0.3);
      text.setStyle({ color: `#${color.toString(16).padStart(6, '0')}` });
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: container, scaleX: 1, scaleY: 1,
        duration: 120, ease: 'Power1',
      });
      bg.setFillStyle(color, 0.15);
      text.setStyle({ color: '#ffffff' });
    });

    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: container, scaleX: 0.96, scaleY: 0.96,
        duration: 80, ease: 'Power1',
        yoyo: true,
        onComplete: () => onPress(),
      });
    });
  }

  private createVersion(width: number, height: number) {
    this.add.text(width - 12, height - 10, 'v0.1.0 · Phaser 4', {
      fontFamily: 'monospace',
      fontSize:   '10px',
      color:      '#444466',
    }).setOrigin(1, 1);
  }

  // Partículas decorativas que suben desde abajo (simula luciérnagas/chispas)
  private startParticleLoop(width: number, height: number) {
    const spawnParticle = () => {
      if (!this.scene.isActive('MenuScene')) return;

      const x    = PMath.Between(20, width - 20);
      const size = PMath.Between(2, 5);
      const col  = [PALETTE.accent, PALETTE.gold, PALETTE.red][PMath.Between(0, 2)];
      const dot  = this.add.rectangle(x, height * 0.72, size, size, col, 0.7);
      this.floatingParticles.push(dot);

      this.tweens.add({
        targets:  dot,
        y:        PMath.Between(height * 0.1, height * 0.5),
        x:        x + PMath.Between(-40, 40),
        alpha:    0,
        duration: PMath.Between(2000, 4000),
        ease:     'Power2',
        onComplete: () => {
          dot.destroy();
          this.floatingParticles = this.floatingParticles.filter(p => p !== dot);
        },
      });

      // Scheduleamos el siguiente
      this.time.delayedCall(PMath.Between(300, 700), spawnParticle);
    };

    this.time.delayedCall(500, spawnParticle);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NAVEGACIÓN
  // ─────────────────────────────────────────────────────────────────────────

  private startGame() {
    // Transición de salida → arranca GameScene en el nivel 1
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { level: 1 });
    });
  }

  private goToLevelSelect() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LevelSelectScene');
    });
  }
}
