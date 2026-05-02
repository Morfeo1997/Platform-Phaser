import { Scene, Physics, GameObjects, Math as PMath } from 'phaser';
import { Enemy } from './Enemy';

// ─── Murciélago volador ────────────────────────────────────────────────────
/**
 * BatEnemy — enemigo aéreo que flota en patrón sinusoidal.
 * Ignora la gravedad y patrulla horizontalmente con oscilación vertical.
 * Al detectar al jugador dentro de `diveRange`, hace un picado hacia él.
 *
 * Uso:
 *   const bat = new BatEnemy(this, 400, 150);
 *   // No necesita colisión con plataformas (vuela)
 *   this.physics.add.overlap(player.attackHitbox, bat.sprite, () => bat.takeDamage(1));
 *   this.physics.add.overlap(player.sprite, bat.sprite, () => { ... daño al jugador ... });
 */
export class BatEnemy extends Enemy {

  // ── Config específica del murciélago ──────────────────────────────────
  private readonly diveRange     = 200;   // px — distancia a la que ataca
  private readonly patrolSpeed   = 90;
  private readonly diveSpeed     = 220;
  private readonly floatAmplitude = 40;   // px de oscilación vertical
  private readonly floatFrequency = 0.002; // rad/ms

  // ── Estado interno ────────────────────────────────────────────────────
  private mode: 'patrol' | 'dive' | 'recover' = 'patrol';
  private originY:      number;
  private timeAccum   = 0;
  private diveTarget  = { x: 0, y: 0 };
  private recoverTimer = 0;
  private readonly RECOVER_MS = 900;

  // Para el aleteo animado
  private wingUp = true;
  private wingTimer = 0;
  private readonly WING_MS = 180;

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, {
      health:     1,
      speed:      90,
      damage:     1,
      scoreValue: 150,
    });
    this.originY = y;

    // Aleatorizamos el offset de la onda para que varios bats no estén sincronizados
    this.timeAccum = PMath.Between(0, 3000);
  }

  // ─── Abstractos implementados ────────────────────────────────────────────

  protected textureKey()    { return 'enemy_bat'; }
  protected textureWidth()  { return 40; }
  protected textureHeight() { return 28; }

  protected buildTexture(g: GameObjects.Graphics) {
    // Cuerpo central
    g.fillStyle(0x6b21a8, 1);
    g.fillEllipse(20, 16, 16, 14);

    // Ala izquierda
    g.fillStyle(0x4c1d95, 1);
    g.fillTriangle(
      20, 12,   // pecho
      0,  6,    // punta del ala
      8,  20,   // base del ala
    );
    // Membrana ala izq (más clara)
    g.fillStyle(0x7c3aed, 0.6);
    g.fillTriangle(20, 14, 2, 8, 10, 22);

    // Ala derecha
    g.fillStyle(0x4c1d95, 1);
    g.fillTriangle(
      20, 12,
      40, 6,
      32, 20,
    );
    g.fillStyle(0x7c3aed, 0.6);
    g.fillTriangle(20, 14, 38, 8, 30, 22);

    // Orejas
    g.fillStyle(0x6b21a8, 1);
    g.fillTriangle(16, 8, 14, 0, 20, 8);
    g.fillTriangle(24, 8, 26, 0, 20, 8);

    // Ojos rojos brillantes
    g.fillStyle(0xff0000, 1);
    g.fillCircle(17, 14, 2);
    g.fillCircle(23, 14, 2);

    // Reflejos de los ojos
    g.fillStyle(0xff8888, 1);
    g.fillCircle(18, 13, 1);
    g.fillCircle(24, 13, 1);
  }

  protected setupBody() {
    // Hitbox compacto centrado en el cuerpo
    this.sprite.body!.setSize(18, 16);
    this.sprite.body!.setOffset(11, 8);

    // El murciélago vuela — sin gravedad
    const body = this.sprite.body as Physics.Arcade.Body;
    body.setGravityY(-600); // cancela la gravedad global del mundo
    body.setAllowGravity(false);
  }

  // ─── IA principal ────────────────────────────────────────────────────────

  protected behave(delta: number, playerX: number) {
    this.timeAccum += delta;
    this.animateWings(delta);

    switch (this.mode) {
      case 'patrol':   this.doPatrol(playerX); break;
      case 'dive':     this.doDive(); break;
      case 'recover':  this.doRecover(delta); break;
    }
  }

  // ── Patrulla sinusoidal ───────────────────────────────────────────────────

  private doPatrol(playerX: number) {
    const body = this.sprite.body as Physics.Arcade.Body;

    // Movimiento horizontal
    if (body.blocked.left || body.blocked.right || body.velocity.x === 0) {
      body.setVelocityX(body.velocity.x <= 0 ? this.patrolSpeed : -this.patrolSpeed);
    }
    this.sprite.setFlipX(body.velocity.x < 0);

    // Oscilación vertical suave (seno)
    const targetY = this.originY + Math.sin(this.timeAccum * this.floatFrequency) * this.floatAmplitude;
    const vy = (targetY - this.sprite.y) * 5;
    body.setVelocityY(vy);

    // Transición a picado si el jugador está cerca
    const dist = Math.abs(playerX - this.sprite.x);
    if (dist < this.diveRange) {
      this.startDive(playerX);
    }
  }

  // ── Picado hacia el jugador ───────────────────────────────────────────────

  private startDive(playerX: number) {
    this.mode = 'dive';
    this.diveTarget = { x: playerX, y: this.sprite.y + 80 };

    // Efecto visual: destella rojo antes del ataque
    this.scene.tweens.add({
      targets:  this.sprite,
      tint:     0xff4444,
      duration: 120,
      yoyo:     true,
      repeat:   1,
    });
  }

  private doDive() {
    const body   = this.sprite.body as Physics.Arcade.Body;
    const dx = this.diveTarget.x - this.sprite.x;
    const dy = this.diveTarget.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      // Llegamos al objetivo → recuperación
      body.setVelocity(0, 0);
      this.mode = 'recover';
      this.recoverTimer = this.RECOVER_MS;
      this.originY = this.sprite.y - 80; // sube de vuelta
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    body.setVelocity(nx * this.diveSpeed, ny * this.diveSpeed);
    this.sprite.setFlipX(dx < 0);
  }

  // ── Recuperación post-picado ──────────────────────────────────────────────

  private doRecover(delta: number) {
    const body = this.sprite.body as Physics.Arcade.Body;
    this.recoverTimer -= delta;

    // Sube lentamente a su posición original
    const dy = this.originY - this.sprite.y;
    body.setVelocity(0, dy * 3);

    if (this.recoverTimer <= 0) {
      this.mode = 'patrol';
      body.setVelocityX(this.patrolSpeed);
    }
  }

  // ── Animación de aleteo ───────────────────────────────────────────────────

  private animateWings(delta: number) {
    this.wingTimer += delta;
    if (this.wingTimer >= this.WING_MS) {
      this.wingTimer = 0;
      this.wingUp = !this.wingUp;
      // Escala Y simula el aleteo
      this.scene.tweens.add({
        targets:  this.sprite,
        scaleY:   this.wingUp ? 1.15 : 0.85,
        duration: this.WING_MS * 0.8,
        ease:     'Sine.easeInOut',
      });
    }
  }
}
