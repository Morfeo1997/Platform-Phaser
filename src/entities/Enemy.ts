import { Scene, Physics, GameObjects } from 'phaser';

// ─── Configuración base de enemigos ───────────────────────────────────────
export interface EnemyConfig {
  health:      number;
  speed:       number;
  damage:      number;
  scoreValue:  number;
}

export const ENEMY_DEFAULTS: EnemyConfig = {
  health:     2,
  speed:      80,
  damage:     1,
  scoreValue: 100,
};

// ─── Clase base Enemy ─────────────────────────────────────────────────────
/**
 * Clase base abstracta para todos los enemigos.
 * Extendela para crear enemigos específicos:
 *
 *   class Slime extends Enemy {
 *     protected buildTexture() { ... }
 *     protected behave(delta: number, playerX: number) { ... }
 *   }
 */
export abstract class Enemy {
  readonly sprite: Physics.Arcade.Sprite;
  protected scene: Scene;
  protected config: EnemyConfig;
  protected hp: number;
  protected alive = true;

  constructor(scene: Scene, x: number, y: number, config: Partial<EnemyConfig> = {}) {
    this.scene  = scene;
    this.config = { ...ENEMY_DEFAULTS, ...config };
    this.hp     = this.config.health;

    // Genera la textura específica de este tipo de enemigo
    const textureKey = this.textureKey();
    if (!scene.textures.exists(textureKey)) {
      const g = scene.add.graphics();
      this.buildTexture(g);
      g.generateTexture(textureKey, this.textureWidth(), this.textureHeight());
      g.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setCollideWorldBounds(true);
    (this.sprite.body as Physics.Arcade.Body).setGravityY(600);

    this.setupBody();
  }

  // ── update ───────────────────────────────────────────────────────────────
  /** Llamar desde la escena en cada frame: enemy.update(delta, player.x) */
  update(delta: number, playerX: number) {
    if (!this.alive) return;
    this.behave(delta, playerX);
  }

  // ── API pública ──────────────────────────────────────────────────────────

  takeDamage(amount: number) {
    if (!this.alive) return;
    this.hp -= amount;
    this.flashHit();
    if (this.hp <= 0) this.die();
  }

  isAlive()     { return this.alive; }
  getScore()    { return this.config.scoreValue; }
  getDamage()   { return this.config.damage; }

  // ─────────────────────────────────────────────────────────────────────────
  // MÉTODOS ABSTRACTOS (cada enemigo los implementa)
  // ─────────────────────────────────────────────────────────────────────────

  /** Clave única de textura para este tipo de enemigo */
  protected abstract textureKey(): string;
  /** Dibuja la textura del enemigo en el Graphics recibido */
  protected abstract buildTexture(g: GameObjects.Graphics): void;
  /** Ancho de la textura en px */
  protected abstract textureWidth(): number;
  /** Alto de la textura en px */
  protected abstract textureHeight(): number;
  /** Ajusta el hitbox del body (llamado en el constructor) */
  protected abstract setupBody(): void;
  /** IA del enemigo — se llama cada frame con la posición del jugador */
  protected abstract behave(delta: number, playerX: number): void;

  // ─────────────────────────────────────────────────────────────────────────
  // COMPORTAMIENTOS COMUNES (disponibles para subclases)
  // ─────────────────────────────────────────────────────────────────────────

  /** Mueve el enemigo hacia el jugador a la velocidad configurada */
  protected chasePlayer(playerX: number) {
    const body = this.sprite.body as Physics.Arcade.Body;
    if (playerX < this.sprite.x) {
      body.setVelocityX(-this.config.speed);
      this.sprite.setFlipX(true);
    } else {
      body.setVelocityX(this.config.speed);
      this.sprite.setFlipX(false);
    }
  }

  /** Patrulla de un lado al otro, invirtiendo al tocar una pared */
  protected patrol() {
    const body = this.sprite.body as Physics.Arcade.Body;
    if (body.blocked.left)  body.setVelocityX( this.config.speed);
    if (body.blocked.right) body.setVelocityX(-this.config.speed);
    if (body.velocity.x === 0) body.setVelocityX(this.config.speed);
  }

  private flashHit() {
    this.scene.tweens.add({
      targets:  this.sprite,
      alpha:    0.2,
      duration: 60,
      yoyo:     true,
      repeat:   2,
    });
  }

  private die() {
    this.alive = false;
    this.scene.tweens.add({
      targets:  this.sprite,
      alpha:    0,
      scaleX:   1.5,
      scaleY:   0,
      y:        this.sprite.y - 10,
      duration: 250,
      ease:     'Power2',
      onComplete: () => this.sprite.destroy(),
    });
  }
}

// ─── Ejemplo de enemigo concreto: Slime ───────────────────────────────────
/**
 * SlimeEnemy — patrulla hasta que el jugador se acerca, luego lo persigue.
 * Descomenta y usá como referencia para crear tus propios enemigos.
 *
 * Uso en GameScene:
 *   const slime = new SlimeEnemy(this, 400, 300);
 *   this.physics.add.collider(slime.sprite, platforms);
 *   this.physics.add.overlap(player.attackHitbox, slime.sprite, () => {
 *     slime.takeDamage(1);
 *   });
 */
export class SlimeEnemy extends Enemy {
  private chaseRange = 180;

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, { health: 2, speed: 70, damage: 1, scoreValue: 100 });
  }

  protected textureKey()    { return 'enemy_slime'; }
  protected textureWidth()  { return 32; }
  protected textureHeight() { return 24; }

  protected buildTexture(g: GameObjects.Graphics) {
    // Cuerpo verde
    g.fillStyle(0x2ecc71, 1);
    g.fillEllipse(16, 16, 30, 22);
    // Ojos
    g.fillStyle(0xffffff, 1);
    g.fillCircle(10, 10, 4);
    g.fillCircle(22, 10, 4);
    g.fillStyle(0x1a1a2e, 1);
    g.fillCircle(11, 10, 2);
    g.fillCircle(23, 10, 2);
  }

  protected setupBody() {
    this.sprite.body!.setSize(26, 18);
    this.sprite.body!.setOffset(3, 6);
  }

  protected behave(_delta: number, playerX: number) {
    const dist = Math.abs(playerX - this.sprite.x);
    if (dist < this.chaseRange) {
      this.chasePlayer(playerX);
    } else {
      this.patrol();
    }
  }
}
