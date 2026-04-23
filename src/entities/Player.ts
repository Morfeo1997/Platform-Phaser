import { Scene, Physics, GameObjects, Input, Math as PMath } from 'phaser';
import type { Types } from 'phaser';

// ─── Constantes ───────────────────────────────────────────────────────────
export const PLAYER_CONFIG = {
  speed:          200,
  jumpVelocity:   -480,
  gravity:        800,
  maxJumps:       2,
  attackDuration: 350,
  // Hitbox dentro del sprite (ajustá a tus sprites reales)
  bodyW:   28,
  bodyH:   44,
  offsetX: 10,
  offsetY: 8,
} as const;

export type PlayerState = 'idle' | 'run' | 'jump' | 'fall' | 'attack';

// ─── Clase Player ─────────────────────────────────────────────────────────
/**
 * Entidad jugador.
 * Recibe la escena en el constructor para acceder a physics, tweens, etc.
 * La escena no sabe nada de la implementación interna del jugador.
 *
 * Uso:
 *   const player = new Player(this, spawnX, spawnY);
 *   // en update():
 *   player.update(delta);
 *   // para colisiones:
 *   this.physics.add.collider(player.sprite, platforms);
 *   // para detectar golpes:
 *   this.physics.add.overlap(player.attackHitbox, enemies, ...);
 */
export class Player {
  // Partes públicas que la escena necesita referenciar
  readonly sprite:      Physics.Arcade.Sprite;
  readonly attackHitbox: GameObjects.Rectangle & { body: Physics.Arcade.StaticBody };

  // Estado interno
  private cursors:      Types.Input.Keyboard.CursorKeys;
  private attackKey:    Input.Keyboard.Key;
  private jumpsLeft   = PLAYER_CONFIG.maxJumps;
  private isAttacking = false;
  private attackTimer = 0;
  private facingRight = true;
  private state: PlayerState = 'idle';

  // Referencia a la escena (solo para effectos visuales / tweens)
  private scene: Scene;

  constructor(scene: Scene, x: number, y: number) {
    this.scene = scene;

    // Generamos las texturas del personaje la primera vez
    Player.generateTextures(scene);

    // Sprite con física
    this.sprite = scene.physics.add.sprite(x, y, 'player_idle');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body!.setSize(PLAYER_CONFIG.bodyW, PLAYER_CONFIG.bodyH);
    this.sprite.body!.setOffset(PLAYER_CONFIG.offsetX, PLAYER_CONFIG.offsetY);
    (this.sprite.body as Physics.Arcade.Body).setGravityY(PLAYER_CONFIG.gravity);

    // Hitbox de golpe (rectángulo invisible con body estático)
    this.attackHitbox = scene.add.rectangle(0, 0, 50, 40, 0xffff00, 0) as
      GameObjects.Rectangle & { body: Physics.Arcade.StaticBody };
    scene.physics.add.existing(this.attackHitbox, true);

    // Input
    this.cursors   = scene.input.keyboard!.createCursorKeys();
    this.attackKey = scene.input.keyboard!.addKey(Input.Keyboard.KeyCodes.Z);

    // Animaciones (idempotente: no las recrea si ya existen)
    Player.createAnimations(scene);

    this.sprite.play('idle');
  }

  // ── update ───────────────────────────────────────────────────────────────
  update(delta: number) {
    this.tickAttackTimer(delta);
    this.handleMovement();
    this.handleJump();
    this.handleAttack();
    this.syncAttackHitbox();
    this.updateAnimation();
  }

  // ── Getters útiles para la escena ────────────────────────────────────────
  get x()            { return this.sprite.x; }
  get y()            { return this.sprite.y; }
  get currentState() { return this.state; }
  get jumps()        { return this.jumpsLeft; }

  // ─────────────────────────────────────────────────────────────────────────
  // LÓGICA INTERNA
  // ─────────────────────────────────────────────────────────────────────────

  private tickAttackTimer(delta: number) {
    if (!this.isAttacking) return;
    this.attackTimer -= delta;
    if (this.attackTimer <= 0) {
      this.isAttacking = false;
      this.attackTimer = 0;
    }
  }

  private handleMovement() {
    const body = this.sprite.body as Physics.Arcade.Body;
    if (this.cursors.left.isDown) {
      body.setVelocityX(-PLAYER_CONFIG.speed);
      this.facingRight = false;
      this.sprite.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(PLAYER_CONFIG.speed);
      this.facingRight = true;
      this.sprite.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }
  }

  private handleJump() {
    const body = this.sprite.body as Physics.Arcade.Body;
    if (body.blocked.down) this.jumpsLeft = PLAYER_CONFIG.maxJumps;

    const pressed =
      Input.Keyboard.JustDown(this.cursors.up) ||
      Input.Keyboard.JustDown(this.cursors.space!);

    if (pressed && this.jumpsLeft > 0) {
      body.setVelocityY(PLAYER_CONFIG.jumpVelocity);
      this.jumpsLeft--;
      if (this.jumpsLeft === 0) this.fxDoubleJump();
    }
  }

  private handleAttack() {
    if (Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking) {
      this.isAttacking = true;
      this.attackTimer = PLAYER_CONFIG.attackDuration;
      this.fxAttack();
    }
  }

  private syncAttackHitbox() {
    if (!this.isAttacking) return;
    const ox = this.facingRight ? 44 : -44;
    const nx = this.sprite.x + ox;
    const ny = this.sprite.y;
    this.attackHitbox.setPosition(nx, ny);
    (this.attackHitbox.body as Physics.Arcade.StaticBody).reset(nx, ny);
  }

  private updateAnimation() {
    const body = this.sprite.body as Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const onGround = body.blocked.down;

    let next: PlayerState;
    if (this.isAttacking)         next = 'attack';
    else if (!onGround && vy < 0) next = 'jump';
    else if (!onGround && vy > 0) next = 'fall';
    else if (Math.abs(vx) > 10)   next = 'run';
    else                          next = 'idle';

    if (next !== this.state) {
      this.state = next;
      this.sprite.play(next);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EFECTOS VISUALES
  // ─────────────────────────────────────────────────────────────────────────

  private fxDoubleJump() {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const speed = PMath.Between(60, 120);
      const dot   = this.scene.add.rectangle(this.sprite.x, this.sprite.y + 20, 6, 6, 0x4ecdc4);
      this.scene.tweens.add({
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
    const cx = this.sprite.x + (this.facingRight ? 50 : -50);
    const cy = this.sprite.y;
    const g  = this.scene.add.graphics();
    g.fillStyle(0xffdd00, 0.9);

    for (let i = 0; i < 5; i++) {
      const a0 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const a1 = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
      const a2 = ((i + 1) * 2 * Math.PI) / 5 - Math.PI / 2;
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a0) * 22, cy + Math.sin(a0) * 22,
        cx + Math.cos(a1) * 10, cy + Math.sin(a1) * 10,
      );
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a1) * 10, cy + Math.sin(a1) * 10,
        cx + Math.cos(a2) * 22, cy + Math.sin(a2) * 22,
      );
    }

    this.scene.tweens.add({
      targets: g, alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: PLAYER_CONFIG.attackDuration * 0.8,
      ease: 'Power2',
      onComplete: () => g.destroy(),
    });
    this.scene.cameras.main.shake(80, 0.004);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEXTURAS Y ANIMACIONES (estáticos — se generan una sola vez)
  // ─────────────────────────────────────────────────────────────────────────

  /** Genera todas las texturas del jugador. Idempotente (chequea si ya existen). */
  static generateTextures(scene: Scene) {
    const frames: Array<[string, (g: GameObjects.Graphics) => void]> = [
      ['player_idle',   Player.drawIdle],
      ['player_run1',   Player.drawRun1],
      ['player_run2',   Player.drawRun2],
      ['player_jump',   Player.drawJump],
      ['player_fall',   Player.drawFall],
      ['player_attack', Player.drawAttack],
    ];

    for (const [key, fn] of frames) {
      if (scene.textures.exists(key)) continue; // ya generada en otra escena
      const g = scene.add.graphics();
      fn(g);
      g.generateTexture(key, 48, 60);
      g.destroy();
    }
  }

  static createAnimations(scene: Scene) {
    const defs = [
      { key: 'idle',   frames: [{ key: 'player_idle' }],   frameRate: 4,  repeat: -1 },
      { key: 'run',    frames: [{ key: 'player_run1' }, { key: 'player_run2' }], frameRate: 10, repeat: -1 },
      { key: 'jump',   frames: [{ key: 'player_jump' }],   frameRate: 4,  repeat: -1 },
      { key: 'fall',   frames: [{ key: 'player_fall' }],   frameRate: 4,  repeat: -1 },
      { key: 'attack', frames: [{ key: 'player_attack' }], frameRate: 4,  repeat: -1 },
    ];
    for (const d of defs) {
      if (!scene.anims.exists(d.key)) scene.anims.create(d);
    }
  }

  // ── Métodos de dibujo (estáticos para no capturar `this`) ───────────────

  private static drawBase(g: GameObjects.Graphics) {
    g.fillStyle(0xe94560); g.fillRect(10, 8, 28, 28);
    g.fillStyle(0xf5a623); g.fillRect(12, 0, 24, 20);
    g.fillStyle(0x1a1a2e); g.fillRect(16, 5, 5, 5);
    g.fillStyle(0x1a1a2e); g.fillRect(26, 5, 5, 5);
    g.fillStyle(0x1a1a2e); g.fillRect(19, 13, 9, 3);
  }

  private static drawIdle(g: GameObjects.Graphics) {
    Player.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(12, 36, 10, 20); g.fillRect(26, 36, 10, 20);
    g.fillStyle(0xe94560); g.fillRect(4, 12, 8, 18);   g.fillRect(36, 12, 8, 18);
  }

  private static drawRun1(g: GameObjects.Graphics) {
    Player.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(12, 36, 10, 16); g.fillRect(26, 36, 10, 24);
    g.fillStyle(0xe94560); g.fillRect(4, 10, 8, 16);   g.fillRect(36, 14, 8, 16);
  }

  private static drawRun2(g: GameObjects.Graphics) {
    Player.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(12, 36, 10, 24); g.fillRect(26, 36, 10, 16);
    g.fillStyle(0xe94560); g.fillRect(4, 14, 8, 16);   g.fillRect(36, 10, 8, 16);
  }

  private static drawJump(g: GameObjects.Graphics) {
    Player.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(10, 36, 12, 14); g.fillRect(26, 36, 12, 14);
    g.fillStyle(0xe94560); g.fillRect(2, 8, 10, 14);   g.fillRect(36, 8, 10, 14);
  }

  private static drawFall(g: GameObjects.Graphics) {
    Player.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(10, 36, 12, 20); g.fillRect(26, 36, 12, 20);
    g.fillStyle(0xe94560); g.fillRect(2, 14, 10, 18);  g.fillRect(36, 14, 10, 18);
  }

  private static drawAttack(g: GameObjects.Graphics) {
    Player.drawBase(g);
    g.fillStyle(0x2d6a4f); g.fillRect(12, 36, 10, 20); g.fillRect(26, 36, 10, 20);
    g.fillStyle(0xe94560); g.fillRect(4, 12, 6, 14);   g.fillRect(36, 10, 14, 10);
    g.fillStyle(0xf5a623); g.fillRect(48, 8, 10, 14);
  }
}
