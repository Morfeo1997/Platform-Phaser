// ✅ Phaser 4 + Vite: usar named imports — "import Phaser from 'phaser'" NO funciona
// ✅ Phaser 4 + Vite: usar named imports — "import Phaser from 'phaser'" NO funciona
import {
  Scene,
  Physics,
  GameObjects,
  Input,
  Math as PMath,
} from 'phaser';
// Types solo se usa en anotaciones → import type (requerido con verbatimModuleSyntax)
import type { Types } from 'phaser';

const PLAYER_SPEED  = 200;
const JUMP_VELOCITY = -480;
const GRAVITY       = 800;
const MAX_JUMPS     = 2;
const ATTACK_MS     = 350;

type PlayerState = 'idle' | 'run' | 'jump' | 'fall' | 'attack';

export class PlatformerScene extends Scene {
  private player!: Physics.Arcade.Sprite;
  private platforms!: Physics.Arcade.StaticGroup;
  private attackHitbox!: GameObjects.Rectangle & { body: Physics.Arcade.StaticBody };

  private cursors!: Types.Input.Keyboard.CursorKeys;
  private attackKey!: Input.Keyboard.Key;

  private jumpsLeft    = MAX_JUMPS;
  private isAttacking  = false;
  private attackTimer  = 0;
  private facingRight  = true;
  private state: PlayerState = 'idle';

  private jumpText!:  GameObjects.Text;
  private stateText!: GameObjects.Text;

  constructor() { super({ key: 'PlatformerScene' }); }

  // ── preload ──────────────────────────────────────────────────────────────
  preload() {
    // Todo es procedural — sin assets externos.
    // Para sprites reales: this.load.spritesheet('player', 'assets/player.png', ...)
  }

  // ── create ───────────────────────────────────────────────────────────────
  create() {
    const { width, height } = this.scale;

    // IMPORTANTE: generar texturas ANTES de crear objetos que las referencien
    this.genTextures(width);

    this.createBackground(width, height);
    this.createPlatforms(width, height);
    this.createPlayer(width, height);

    // Hitbox de golpe (rectángulo invisible con física estática)
    this.attackHitbox = this.add.rectangle(0, 0, 50, 40, 0xffff00, 0) as GameObjects.Rectangle & { body: Physics.Arcade.StaticBody };
    this.physics.add.existing(this.attackHitbox, true);

    this.createAnimations();
    this.createInput();
    this.createHUD();
    this.physics.add.collider(this.player, this.platforms);
  }

  // ── update ───────────────────────────────────────────────────────────────
  update(_t: number, delta: number) {
    if (this.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) { this.isAttacking = false; this.attackTimer = 0; }
    }

    const body = this.player.body as Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // Movimiento horizontal
    if (this.cursors.left.isDown) {
      body.setVelocityX(-PLAYER_SPEED);
      this.facingRight = false;
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(PLAYER_SPEED);
      this.facingRight = true;
      this.player.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // Salto doble
    if (onGround) this.jumpsLeft = MAX_JUMPS;
    const jumpPressed =
      Input.Keyboard.JustDown(this.cursors.up) ||
      Input.Keyboard.JustDown(this.cursors.space!);
    if (jumpPressed && this.jumpsLeft > 0) {
      body.setVelocityY(JUMP_VELOCITY);
      this.jumpsLeft--;
      if (this.jumpsLeft === 0) this.fxDoubleJump();
    }

    // Golpe
    if (Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking) {
      this.isAttacking = true;
      this.attackTimer = ATTACK_MS;
      this.fxAttack();
    }

    // Posicionar hitbox de golpe
    if (this.isAttacking) {
      const ox = this.facingRight ? 44 : -44;
      this.attackHitbox.setPosition(this.player.x + ox, this.player.y);
      (this.attackHitbox.body as Physics.Arcade.StaticBody).reset(this.player.x + ox, this.player.y);
    }

    // Animación según estado
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    let next: PlayerState;
    if (this.isAttacking)         next = 'attack';
    else if (!onGround && vy < 0) next = 'jump';
    else if (!onGround && vy > 0) next = 'fall';
    else if (Math.abs(vx) > 10)   next = 'run';
    else                          next = 'idle';

    if (next !== this.state) { this.state = next; this.player.play(next); }

    // HUD
    const dots = Array.from({ length: MAX_JUMPS }, (_, i) => i < this.jumpsLeft ? '◆' : '◇').join(' ');
    this.jumpText.setText(`Saltos: ${dots}`);
    this.stateText.setText(`Estado: ${this.state}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEXTURAS PROCEDURALES
  // ─────────────────────────────────────────────────────────────────────────

  private genTextures(width: number) {
    // Un Graphics separado por textura — crítico en Phaser 4
    const playerFrames: Array<[string, (g: GameObjects.Graphics) => void]> = [
      ['player_idle',   this.drawIdle.bind(this)],
      ['player_run1',   this.drawRun1.bind(this)],
      ['player_run2',   this.drawRun2.bind(this)],
      ['player_jump',   this.drawJump.bind(this)],
      ['player_fall',   this.drawFall.bind(this)],
      ['player_attack', this.drawAttack.bind(this)],
    ];
    for (const [key, fn] of playerFrames) {
      const g = this.add.graphics();
      fn(g);
      g.generateTexture(key, 48, 60);
      g.destroy();
    }

    // Textura del suelo
    {
      const g = this.add.graphics();
      g.fillStyle(0x4ecdc4, 1); g.fillRect(0, 0, width, 4);
      g.fillStyle(0x1a5c3a, 1); g.fillRect(0, 4, width, 36);
      g.generateTexture('ground', width, 40);
      g.destroy();
    }

    // Textura de plataforma flotante
    {
      const g = this.add.graphics();
      g.fillStyle(0x4ecdc4, 1); g.fillRect(0, 0, 220, 4);
      g.fillStyle(0x2d6a4f, 1); g.fillRect(0, 4, 220, 20);
      g.generateTexture('platform', 220, 24);
      g.destroy();
    }
  }

  // ── Frames del personaje ─────────────────────────────────────────────────

  private drawBase(g: GameObjects.Graphics) {
    g.fillStyle(0xe94560); g.fillRect(10, 8, 28, 28);          // torso
    g.fillStyle(0xf5a623); g.fillRect(12, 0, 24, 20);          // cabeza
    g.fillStyle(0x1a1a2e); g.fillRect(16, 5, 5, 5);            // ojo izq
    g.fillStyle(0x1a1a2e); g.fillRect(26, 5, 5, 5);            // ojo der
    g.fillStyle(0x1a1a2e); g.fillRect(19, 13, 9, 3);           // boca
  }

  private drawIdle(g: GameObjects.Graphics) {
    this.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(12, 36, 10, 20); g.fillRect(26, 36, 10, 20);
    g.fillStyle(0xe94560); g.fillRect(4, 12, 8, 18);   g.fillRect(36, 12, 8, 18);
  }

  private drawRun1(g: GameObjects.Graphics) {
    this.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(12, 36, 10, 16); g.fillRect(26, 36, 10, 24);
    g.fillStyle(0xe94560); g.fillRect(4, 10, 8, 16);   g.fillRect(36, 14, 8, 16);
  }

  private drawRun2(g: GameObjects.Graphics) {
    this.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(12, 36, 10, 24); g.fillRect(26, 36, 10, 16);
    g.fillStyle(0xe94560); g.fillRect(4, 14, 8, 16);   g.fillRect(36, 10, 8, 16);
  }

  private drawJump(g: GameObjects.Graphics) {
    this.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(10, 36, 12, 14); g.fillRect(26, 36, 12, 14);
    g.fillStyle(0xe94560); g.fillRect(2, 8, 10, 14);   g.fillRect(36, 8, 10, 14);
  }

  private drawFall(g: GameObjects.Graphics) {
    this.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(10, 36, 12, 20); g.fillRect(26, 36, 12, 20);
    g.fillStyle(0xe94560); g.fillRect(2, 14, 10, 18);  g.fillRect(36, 14, 10, 18);
  }

  private drawAttack(g: GameObjects.Graphics) {
    this.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(12, 36, 10, 20); g.fillRect(26, 36, 10, 20);
    g.fillStyle(0xe94560); g.fillRect(4, 12, 6, 14);   g.fillRect(36, 10, 14, 10); // brazo extendido
    g.fillStyle(0xf5a623); g.fillRect(48, 8, 10, 14);  // puño
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SETUP DE ESCENA
  // ─────────────────────────────────────────────────────────────────────────

  private createBackground(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
    bg.fillRect(0, 0, width, height);
    for (let i = 0; i < 60; i++) {
      const x = PMath.Between(0, width);
      const y = PMath.Between(0, height * 0.7);
      bg.fillStyle(0xffffff, PMath.FloatBetween(0.4, 1));
      bg.fillRect(x, y, Math.random() < 0.3 ? 2 : 1, Math.random() < 0.3 ? 2 : 1);
    }
  }

  private createPlatforms(width: number, height: number) {
    this.platforms = this.physics.add.staticGroup();

    const ground = this.platforms.create(width / 2, height - 20, 'ground') as Physics.Arcade.Sprite;
    ground.setImmovable(true).refreshBody();

    const positions = [
      { x: 150,          y: height - 160 },
      { x: width / 2,    y: height - 260 },
      { x: width - 150,  y: height - 200 },
      { x: 300,          y: height - 370 },
      { x: width - 200,  y: height - 400 },
    ];
    for (const pos of positions) {
      const p = this.platforms.create(pos.x, pos.y, 'platform') as Physics.Arcade.Sprite;
      p.setImmovable(true).refreshBody();
    }
  }

  private createPlayer(width: number, height: number) {
    this.player = this.physics.add.sprite(width / 2, height - 80, 'player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.body!.setSize(28, 44);
    this.player.body!.setOffset(10, 8);
    (this.player.body as Physics.Arcade.Body).setGravityY(GRAVITY);
  }

  private createAnimations() {
    const defs: Types.Animations.Animation[] = [
      { key: 'idle',   frames: [{ key: 'player_idle' }],   frameRate: 4,  repeat: -1 },
      { key: 'run',    frames: [{ key: 'player_run1' }, { key: 'player_run2' }], frameRate: 10, repeat: -1 },
      { key: 'jump',   frames: [{ key: 'player_jump' }],   frameRate: 4,  repeat: -1 },
      { key: 'fall',   frames: [{ key: 'player_fall' }],   frameRate: 4,  repeat: -1 },
      { key: 'attack', frames: [{ key: 'player_attack' }], frameRate: 4,  repeat: -1 },
    ];
    for (const d of defs) {
      if (!this.anims.exists(d.key as string)) this.anims.create(d);
    }
  }

  private createInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.Z);
  }

  private createHUD() {
    const base = { fontFamily: 'monospace', stroke: '#000', strokeThickness: 3 };
    this.jumpText  = this.add.text(12, 12, '', { ...base, fontSize: '14px', color: '#4ecdc4' }).setScrollFactor(0).setDepth(10);
    this.stateText = this.add.text(12, 32, '', { ...base, fontSize: '14px', color: '#4ecdc4' }).setScrollFactor(0).setDepth(10);
    this.add.text(12, 52, '← → Mover  |  ↑ Saltar (2x)  |  Z Golpear',
      { ...base, fontSize: '12px', color: '#888', strokeThickness: 2 }).setScrollFactor(0).setDepth(10);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EFECTOS VISUALES
  // ─────────────────────────────────────────────────────────────────────────

  private fxDoubleJump() {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const speed = PMath.Between(60, 120);
      const dot = this.add.rectangle(this.player.x, this.player.y + 20, 6, 6, 0x4ecdc4);
      this.tweens.add({
        targets: dot,
        x: dot.x + Math.cos(angle) * speed,
        y: dot.y + Math.sin(angle) * speed,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 400, ease: 'Power2',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private fxAttack() {
    const cx = this.player.x + (this.facingRight ? 50 : -50);
    const cy = this.player.y;
    const g = this.add.graphics();
    g.fillStyle(0xffdd00, 0.9);

    // fillPoints requiere Vector2[] — usamos fillTriangle en abanico desde el centro
    // para dibujar la estrella sin depender del tipo Vector2
    const spikes = 5;
    for (let i = 0; i < spikes; i++) {
      const a0 = (i * 2 * Math.PI) / spikes - Math.PI / 2;
      const a1 = ((i + 0.5) * 2 * Math.PI) / spikes - Math.PI / 2;
      const a2 = ((i + 1) * 2 * Math.PI) / spikes - Math.PI / 2;
      // triángulo pico exterior
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a0) * 22, cy + Math.sin(a0) * 22,
        cx + Math.cos(a1) * 10, cy + Math.sin(a1) * 10,
      );
      // triángulo pico interior (cierra la forma)
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a1) * 10, cy + Math.sin(a1) * 10,
        cx + Math.cos(a2) * 22, cy + Math.sin(a2) * 22,
      );
    }
    this.tweens.add({
      targets: g, alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: ATTACK_MS * 0.8, ease: 'Power2',
      onComplete: () => g.destroy(),
    });
    this.cameras.main.shake(80, 0.004);
  }
}
