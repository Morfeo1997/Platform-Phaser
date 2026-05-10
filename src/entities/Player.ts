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
    // El slash barre un arco adelante del jugador.
    // Hitbox: ancho moderado, alto para cubrir el arco vertical del corte.
    const ox = this.facingRight ? 48 : -48;
    const nx = this.sprite.x + ox;
    const ny = this.sprite.y;
    this.attackHitbox.setSize(52, 70);
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
    const dir   = this.facingRight ? 1 : -1;
    const originX = this.sprite.x + dir * 20; // base del slash, pegado al cuerpo
    const originY = this.sprite.y;

    // ── Slash: 3 arcos superpuestos en distintos colores / tamaños ──────────
    // Cada arco es un abanico de triángulos que describe un corte diagonal.
    // El arco barre desde arriba-adelante hacia abajo-adelante según la dirección.
    const slashDefs = [
      { radius: 55, width: 22, color: 0xffffff, alpha: 1.0 },  // corte exterior — blanco
      { radius: 42, width: 18, color: 0x88eeff, alpha: 0.85 }, // corte medio — cyan claro
      { radius: 28, width: 14, color: 0x00ccff, alpha: 0.7 },  // corte interior — cyan
    ];

    // Ángulo de barrido: el slash va de -100° a +20° (mirando a la derecha),
    // espejado si mira a la izquierda.
    const startAngle = dir === 1 ? -1.75 : -1.40; // radianes
    const endAngle   = dir === 1 ?  0.35 : Math.PI + 0.35;
    const steps      = 6; // triángulos que forman el abanico

    slashDefs.forEach(({ radius, width, color, alpha }, layerIdx) => {
      const g = this.scene.add.graphics();
      g.fillStyle(color, alpha);

      for (let i = 0; i < steps; i++) {
        const t0 = i / steps;
        const t1 = (i + 1) / steps;
        const a0 = startAngle + t0 * (endAngle - startAngle);
        const a1 = startAngle + t1 * (endAngle - startAngle);

        // Triángulo exterior (punta del corte)
        g.fillTriangle(
          originX + Math.cos(a0) * (radius - width / 2),
          originY + Math.sin(a0) * (radius - width / 2),
          originX + Math.cos(a0) * (radius + width / 2),
          originY + Math.sin(a0) * (radius + width / 2),
          originX + Math.cos(a1) * (radius + width / 2),
          originY + Math.sin(a1) * (radius + width / 2),
        );
        // Triángulo interior (cierra el abanico)
        g.fillTriangle(
          originX + Math.cos(a0) * (radius - width / 2),
          originY + Math.sin(a0) * (radius - width / 2),
          originX + Math.cos(a1) * (radius + width / 2),
          originY + Math.sin(a1) * (radius + width / 2),
          originX + Math.cos(a1) * (radius - width / 2),
          originY + Math.sin(a1) * (radius - width / 2),
        );
      }

      // Cada capa se mueve ligeramente en la dirección del corte y desvanece
      this.scene.tweens.add({
        targets:  g,
        x:        dir * (14 + layerIdx * 4), // las capas interiores se mueven menos
        alpha:    0,
        duration: PLAYER_CONFIG.attackDuration * 0.65,
        delay:    layerIdx * 18,             // escalonado: exterior primero
        ease:     'Power2',
        onComplete: () => g.destroy(),
      });
    });

    // ── Destello en el origen del corte ──────────────────────────────────────
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 0.9);
    flash.fillCircle(originX, originY, 6);
    this.scene.tweens.add({
      targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5,
      duration: 120, ease: 'Power2',
      onComplete: () => flash.destroy(),
    });

    // ── Shake de cámara más corto que el de la estrella (el slash es más ágil)
    this.scene.cameras.main.shake(50, 0.003);
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
