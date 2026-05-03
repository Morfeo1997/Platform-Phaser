import { Scene, Physics, GameObjects, Math as PMath } from 'phaser';
import { Player }      from '../entities/Player';
import { SlimeEnemy }  from '../entities/Enemy';
import { BatEnemy }    from '../entities/BatEnemy';
import { getLevel }    from '../data/levels';
import type { LevelData } from '../data/levels';

// ─── Tipos internos ───────────────────────────────────────────────────────
interface GameSceneData { level?: number }

type AnyEnemy = SlimeEnemy | BatEnemy;

// ─── Escena de juego ──────────────────────────────────────────────────────
export class GameScene extends Scene {

  // Entidades
  private player!:    Player;
  private enemies:    AnyEnemy[] = [];
  private platforms!: Physics.Arcade.StaticGroup;
  private enemyGroup!: Physics.Arcade.Group;

  // Datos del nivel
  private levelData!: LevelData;
  private currentLevel = 1;

  // Estado del juego
  private score  = 0;
  private lives  = 3;
  private paused = false;
  private playerInvincible = false;

  // HUD
  private hudScore!: GameObjects.Text;
  private hudLives!: GameObjects.Text;
  private hudJumps!: GameObjects.Text;
  private hudLevel!: GameObjects.Text;

  constructor() { super({ key: 'GameScene' }); }

  // ── init ─────────────────────────────────────────────────────────────────
  init(data: GameSceneData) {
    this.currentLevel    = data.level ?? 1;
    this.enemies         = [];
    this.score           = 0;
    this.lives           = 3;
    this.paused          = false;
    this.playerInvincible = false;
  }

  // ── preload ──────────────────────────────────────────────────────────────
  preload() {
    // Cuando tengas assets reales:
    //   this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 48, frameHeight: 60 });
    //   this.load.audio('jump', 'assets/sounds/jump.wav');
  }

  // ── create ───────────────────────────────────────────────────────────────
  create() {
    this.levelData = getLevel(this.currentLevel);
    const { width, height } = this.scale;

    this.createBackground(width, height);
    this.generatePlatformTextures(width, this.levelData);
    this.createPlatforms(width, height);

    // Spawn del jugador según config del nivel
    const px = this.levelData.playerSpawn.x * width;
    const py = this.levelData.playerSpawn.y * height;
    this.player = new Player(this, px, py);

    this.enemyGroup = this.physics.add.group();
    this.spawnEnemies(width, height);
    this.setupColliders();
    this.createHUD(width);
    this.createButtons(width);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ── update ───────────────────────────────────────────────────────────────
  update(_t: number, delta: number) {
    if (this.paused) return;

    this.player.update(delta);

    for (const e of this.enemies) {
      if (e.isAlive()) e.update(delta, this.player.x);
    }

    this.updateHUD();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BACKGROUND
  // ─────────────────────────────────────────────────────────────────────────

  private createBackground(width: number, height: number) {
    const [c1, c2, c3, c4] = this.levelData.bgColors;
    const bg = this.add.graphics();
    bg.fillGradientStyle(c1, c2, c3, c4, 1);
    bg.fillRect(0, 0, width, height);

    // Nivel 2: lava animada en el fondo
    if (this.currentLevel === 2) {
      this.createLavaEffect(width, height);
    } else {
      // Estrellas para nivel 1
      for (let i = 0; i < 60; i++) {
        const x = PMath.Between(0, width);
        const y = PMath.Between(0, height * 0.7);
        bg.fillStyle(0xffffff, PMath.FloatBetween(0.4, 1));
        bg.fillRect(x, y, Math.random() < 0.3 ? 2 : 1, 1);
      }
    }
  }

  /** Efecto de lava pulsante en el fondo del nivel 2 */
  private createLavaEffect(width: number, height: number) {
    // Charcos de lava en el suelo
    const lava = this.add.graphics();
    lava.fillStyle(0xff4500, 0.3);
    lava.fillRect(0, height * 0.9, width, height * 0.1);

    // Burbujas ascendentes
    const spawnBubble = () => {
      if (!this.scene.isActive('GameScene')) return;
      const x   = PMath.Between(0, width);
      const dot  = this.add.circle(x, height - 10, PMath.Between(3, 8), 0xff6b00, 0.6);
      this.tweens.add({
        targets:  dot,
        y:        height * PMath.FloatBetween(0.7, 0.85),
        alpha:    0,
        scaleX:   0,
        scaleY:   0,
        duration: PMath.Between(1000, 2500),
        ease:     'Power1',
        onComplete: () => dot.destroy(),
      });
      this.time.delayedCall(PMath.Between(200, 600), spawnBubble);
    };
    this.time.delayedCall(300, spawnBubble);

    // Resplandor pulsante en el suelo
    const glow = this.add.graphics();
    glow.fillStyle(0xff4500, 0.15);
    glow.fillRect(0, height - 50, width, 50);
    this.tweens.add({
      targets: glow, alpha: 0.05,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Rocas decorativas
    this.drawRocks(width, height);
  }

  private drawRocks(width: number, height: number) {
    const g = this.add.graphics();
    g.fillStyle(0x2d0e00, 0.8);
    const rockPositions = [0.1, 0.3, 0.55, 0.75, 0.9];
    for (const rx of rockPositions) {
      const x = rx * width;
      const y = height - 40;
      const w = PMath.Between(30, 60);
      const h = PMath.Between(15, 30);
      g.fillRect(x - w / 2, y - h, w, h);
      // Pico de la roca
      g.fillTriangle(x - w / 2, y - h, x + w / 2, y - h, x, y - h - 12);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PLATAFORMAS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Genera texturas de plataforma y suelo con los colores del nivel actual.
   * Usa keys únicos por nivel para no reutilizar texturas del nivel anterior.
   */
  private generatePlatformTextures(width: number, data: LevelData) {
    const groundKey   = `ground_l${data.id}`;
    const platformKey = `platform_l${data.id}`;

    if (!this.textures.exists(groundKey)) {
      const g = this.add.graphics();
      g.fillStyle(data.groundTop, 1);   g.fillRect(0, 0, width, 4);
      g.fillStyle(data.groundBody, 1);  g.fillRect(0, 4, width, 36);
      g.generateTexture(groundKey, width, 40);
      g.destroy();
    }

    if (!this.textures.exists(platformKey)) {
      const g = this.add.graphics();
      g.fillStyle(data.platformTop, 1);  g.fillRect(0, 0, 220, 4);
      g.fillStyle(data.platformBody, 1); g.fillRect(0, 4, 220, 20);
      g.generateTexture(platformKey, 220, 24);
      g.destroy();
    }
  }

  private createPlatforms(width: number, height: number) {
    this.platforms = this.physics.add.staticGroup();
    const data = this.levelData;
    const groundKey   = `ground_l${data.id}`;
    const platformKey = `platform_l${data.id}`;

    // Suelo completo
    const ground = this.platforms.create(width / 2, height - 20, groundKey) as Physics.Arcade.Sprite;
    ground.setImmovable(true).refreshBody();

    // Plataformas desde la config del nivel
    for (const def of data.platforms) {
      const x  = def.absolute ? def.x : def.x * width;
      const y  = def.absolute ? def.y : def.y * height;
      const pw = def.width ?? 140;

      // Si el ancho es distinto del default (220), generamos una textura ad-hoc
      let texKey = platformKey;
      if (pw !== 220) {
        texKey = `platform_l${data.id}_w${pw}`;
        if (!this.textures.exists(texKey)) {
          const g = this.add.graphics();
          g.fillStyle(data.platformTop, 1);  g.fillRect(0, 0, pw, 4);
          g.fillStyle(data.platformBody, 1); g.fillRect(0, 4, pw, 20);
          g.generateTexture(texKey, pw, 24);
          g.destroy();
        }
      }

      const p = this.platforms.create(x, y, texKey) as Physics.Arcade.Sprite;
      p.setImmovable(true).refreshBody();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ENEMIGOS
  // ─────────────────────────────────────────────────────────────────────────

  private spawnEnemies(width: number, height: number) {
    for (const spawn of this.levelData.enemies) {
      const x = spawn.x * width;
      const y = spawn.y * height;

      switch (spawn.type) {
        case 'slime': {
          const slime = new SlimeEnemy(this, x, y);
          this.enemies.push(slime);
          this.physics.add.collider(slime.sprite, this.platforms);
          this.enemyGroup.add(slime.sprite);
          break;
        }
        case 'bat': {
          const bat = new BatEnemy(this, x, y);
          this.enemies.push(bat);
          // Los bats no colisionan con plataformas (vuelan)
          this.enemyGroup.add(bat.sprite);
          break;
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COLISIONES Y OVERLAPS
  // ─────────────────────────────────────────────────────────────────────────

  private setupColliders() {
    // Jugador vs plataformas
    this.physics.add.collider(this.player.sprite, this.platforms);

    // Golpe del jugador vs enemigos
    this.physics.add.overlap(
      this.player.attackHitbox,
      this.enemyGroup,
      (_hitbox, enemySprite) => {
        const enemy = this.enemies.find(e => e.sprite === enemySprite);
        if (enemy?.isAlive()) {
          enemy.takeDamage(1);
          if (!enemy.isAlive()) {
            this.addScore(enemy.getScore());
          }
        }
      },
    );

    // Contacto enemigo vs jugador (daño)
    this.physics.add.overlap(
      this.player.sprite,
      this.enemyGroup,
      (_playerSprite, enemySprite) => {
        const enemy = this.enemies.find(e => e.sprite === enemySprite);
        if (enemy?.isAlive()) {
          this.hurtPlayer(enemy.getDamage());
        }
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SISTEMA DE DAÑO Y VIDAS
  // ─────────────────────────────────────────────────────────────────────────

  private hurtPlayer(damage: number) {
    if (this.playerInvincible) return;

    this.lives -= damage;
    this.playerInvincible = true;

    // Parpadeo de invencibilidad (0.8s)
    this.tweens.add({
      targets:  this.player.sprite,
      alpha:    0.3,
      duration: 100,
      yoyo:     true,
      repeat:   7,
      onComplete: () => {
        this.player.sprite.setAlpha(1);
        this.playerInvincible = false;
      },
    });

    // Knock-back leve
    const body = this.player.sprite.body as Physics.Arcade.Body;
    body.setVelocityY(-200);

    // Shake de cámara
    this.cameras.main.shake(150, 0.008);

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  private addScore(points: number) {
    this.score += points;

    // Popup de puntos flotantes
    const popup = this.add.text(
      this.player.x, this.player.y - 30,
      `+${points}`,
      { fontFamily: 'monospace', fontSize: '14px', color: '#f5a623', stroke: '#000', strokeThickness: 3 },
    ).setDepth(20);

    this.tweens.add({
      targets:  popup,
      y:        popup.y - 40,
      alpha:    0,
      duration: 700,
      ease:     'Power2',
      onComplete: () => popup.destroy(),
    });
  }

  private gameOver() {
    this.paused = true;
    this.cameras.main.fadeOut(500, 50, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Por ahora vuelve al menú — en el futuro podés mostrar una pantalla de Game Over
      this.scene.start('MenuScene');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────────────────────────────────────

  private createHUD(width: number) {
    // Barra HUD semitransparente
    const bar = this.add.graphics().setScrollFactor(0).setDepth(9);
    bar.fillStyle(0x000000, 0.4);
    bar.fillRect(0, 0, width, 72);

    const base = {
      fontFamily:      'monospace',
      stroke:          '#000000',
      strokeThickness: 3,
    };

    this.hudLevel = this.add.text(width / 2, 10, `NIVEL ${this.currentLevel}: ${this.levelData.name}`, {
      ...base, fontSize: '12px', color: '#f5a623',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

    this.hudScore = this.add.text(12, 10, 'SCORE: 0', {
      ...base, fontSize: '12px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(10);

    this.hudLives = this.add.text(12, 28, '❤️❤️❤️', {
      ...base, fontSize: '13px', color: '#e94560',
    }).setScrollFactor(0).setDepth(10);

    this.hudJumps = this.add.text(12, 48, '', {
      ...base, fontSize: '12px', color: '#4ecdc4',
    }).setScrollFactor(0).setDepth(10);

    // Controles (derecha)
    this.add.text(width - 12, 10, '← → Mover  ↑ Saltar(x2)  Z Golpear', {
      fontFamily: 'monospace', fontSize: '10px', color: '#555577',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);
  }

  private createButtons(width: number) {
    const btn = this.add.text(width - 12, 30, '⏸ MENÚ', {
      fontFamily: 'monospace', fontSize: '11px', color: '#555577',
      stroke: '#000', strokeThickness: 2,
    })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ color: '#4ecdc4' }));
    btn.on('pointerout',  () => btn.setStyle({ color: '#555577' }));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  private updateHUD() {
    this.hudScore.setText(`SCORE: ${this.score}`);

    const heartsOn  = '❤️'.repeat(Math.max(0, this.lives));
    const heartsOff = '🖤'.repeat(Math.max(0, 3 - this.lives));
    this.hudLives.setText(heartsOn + heartsOff);

    const dots = Array.from(
      { length: 2 },
      (_, i) => i < this.player.jumps ? '◆' : '◇',
    ).join(' ');
    this.hudJumps.setText(`Saltos: ${dots}  Estado: ${this.player.currentState}`);
  }
}
