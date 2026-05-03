import { Scene, Physics, GameObjects, Math as PMath } from 'phaser';
import { Player }      from '../entities/Player';
import { SlimeEnemy }  from '../entities/Enemy';
import { BatEnemy }    from '../entities/BatEnemy';
import { StarGoal }    from '../entities/StarGoal';
import { getLevel }    from '../data/levels/index';
import type { LevelData } from '../data/levels/index';

// ─── Tipos ────────────────────────────────────────────────────────────────
interface GameSceneData { level?: number }
type AnyEnemy = SlimeEnemy | BatEnemy;

// ─── Escena de juego ──────────────────────────────────────────────────────
export class GameScene extends Scene {

  private player!:     Player;
  private enemies:     AnyEnemy[] = [];
  private platforms!:  Physics.Arcade.StaticGroup;
  private enemyGroup!: Physics.Arcade.Group;
  private star!:       StarGoal;

  private levelData!:     LevelData;
  private currentLevel  = 1;
  private score         = 0;
  private lives         = 3;
  private paused        = false;
  private playerInvincible = false;

  private hudScore!: GameObjects.Text;
  private hudLives!: GameObjects.Text;
  private hudJumps!: GameObjects.Text;

  constructor() { super({ key: 'GameScene' }); }

  // ── init ─────────────────────────────────────────────────────────────────
  init(data: GameSceneData) {
    this.currentLevel     = data.level ?? 1;
    this.enemies          = [];
    this.score            = 0;
    this.lives            = 3;
    this.paused           = false;
    this.playerInvincible = false;
  }

  // ── preload ──────────────────────────────────────────────────────────────
  preload() {
    // this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 48, frameHeight: 60 });
  }

  // ── create ───────────────────────────────────────────────────────────────
  create() {
    this.levelData = getLevel(this.currentLevel);
    const { width, height } = this.scale;

    this.createBackground(width, height);
    this.generatePlatformTextures(width);
    this.createPlatforms(width, height);

    const px = this.levelData.playerSpawn.x * width;
    const py = this.levelData.playerSpawn.y * height;
    this.player = new Player(this, px, py);

    // Estrella de victoria
    const gx = this.levelData.goalPosition.x * width;
    const gy = this.levelData.goalPosition.y * height;
    this.star = new StarGoal(this, gx, gy, () => this.triggerVictory());

    this.enemyGroup = this.physics.add.group();
    this.spawnEnemies(width, height);
    this.setupColliders();
    this.createHUD(width);
    this.createMenuButton(width);

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
  // BACKGROUND — lee backgroundEffect desde LevelData, sin ifs por nivel
  // ─────────────────────────────────────────────────────────────────────────

  private createBackground(width: number, height: number) {
    const [c1, c2, c3, c4] = this.levelData.bgColors;
    const bg = this.add.graphics();
    bg.fillGradientStyle(c1, c2, c3, c4, 1);
    bg.fillRect(0, 0, width, height);

    switch (this.levelData.backgroundEffect) {
      case 'stars': this.fxStars(bg, width, height); break;
      case 'lava':  this.fxLava(width, height);       break;
    }
  }

  private fxStars(bg: GameObjects.Graphics, width: number, height: number) {
    for (let i = 0; i < 60; i++) {
      const x = PMath.Between(0, width);
      const y = PMath.Between(0, height * 0.7);
      bg.fillStyle(0xffffff, PMath.FloatBetween(0.4, 1));
      bg.fillRect(x, y, Math.random() < 0.3 ? 2 : 1, 1);
    }
  }

  private fxLava(width: number, height: number) {
    const lava = this.add.graphics();
    lava.fillStyle(0xff4500, 0.3);
    lava.fillRect(0, height * 0.9, width, height * 0.1);

    const spawnBubble = () => {
      if (!this.scene.isActive('GameScene')) return;
      const x   = PMath.Between(0, width);
      const dot = this.add.circle(x, height - 10, PMath.Between(3, 8), 0xff6b00, 0.6);
      this.tweens.add({
        targets: dot,
        y: height * PMath.FloatBetween(0.7, 0.85),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: PMath.Between(1000, 2500), ease: 'Power1',
        onComplete: () => dot.destroy(),
      });
      this.time.delayedCall(PMath.Between(200, 600), spawnBubble);
    };
    this.time.delayedCall(300, spawnBubble);

    const glow = this.add.graphics();
    glow.fillStyle(0xff4500, 0.15);
    glow.fillRect(0, height - 50, width, 50);
    this.tweens.add({ targets: glow, alpha: 0.05, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Rocas decorativas
    const g = this.add.graphics();
    g.fillStyle(0x2d0e00, 0.8);
    for (const rx of [0.1, 0.3, 0.55, 0.75, 0.9]) {
      const x = rx * width;
      const y = height - 40;
      const w = PMath.Between(30, 60);
      const h = PMath.Between(15, 30);
      g.fillRect(x - w / 2, y - h, w, h);
      g.fillTriangle(x - w / 2, y - h, x + w / 2, y - h, x, y - h - 12);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PLATAFORMAS
  // ─────────────────────────────────────────────────────────────────────────

  private generatePlatformTextures(width: number) {
    const { id, groundTop, groundBody, platformTop, platformBody } = this.levelData;

    if (!this.textures.exists(`ground_l${id}`)) {
      const g = this.add.graphics();
      g.fillStyle(groundTop, 1);  g.fillRect(0, 0, width, 4);
      g.fillStyle(groundBody, 1); g.fillRect(0, 4, width, 36);
      g.generateTexture(`ground_l${id}`, width, 40);
      g.destroy();
    }

    if (!this.textures.exists(`platform_l${id}`)) {
      const g = this.add.graphics();
      g.fillStyle(platformTop, 1);  g.fillRect(0, 0, 220, 4);
      g.fillStyle(platformBody, 1); g.fillRect(0, 4, 220, 20);
      g.generateTexture(`platform_l${id}`, 220, 24);
      g.destroy();
    }
  }

  private createPlatforms(width: number, height: number) {
    this.platforms = this.physics.add.staticGroup();
    const { id, platformTop, platformBody } = this.levelData;

    const ground = this.platforms.create(width / 2, height - 20, `ground_l${id}`) as Physics.Arcade.Sprite;
    ground.setImmovable(true).refreshBody();

    for (const def of this.levelData.platforms) {
      const x  = def.absolute ? def.x : def.x * width;
      const y  = def.absolute ? def.y : def.y * height;
      const pw = def.width ?? 140;

      let texKey = `platform_l${id}`;
      if (pw !== 220) {
        texKey = `platform_l${id}_w${pw}`;
        if (!this.textures.exists(texKey)) {
          const g = this.add.graphics();
          g.fillStyle(platformTop, 1);  g.fillRect(0, 0, pw, 4);
          g.fillStyle(platformBody, 1); g.fillRect(0, 4, pw, 20);
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
          const e = new SlimeEnemy(this, x, y);
          this.enemies.push(e);
          this.physics.add.collider(e.sprite, this.platforms);
          this.enemyGroup.add(e.sprite);
          break;
        }
        case 'bat': {
          const e = new BatEnemy(this, x, y);
          this.enemies.push(e);
          this.enemyGroup.add(e.sprite);
          break;
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COLISIONES
  // ─────────────────────────────────────────────────────────────────────────

  private setupColliders() {
    this.physics.add.collider(this.player.sprite, this.platforms);

    // Golpe del jugador → enemigos
    this.physics.add.overlap(
      this.player.attackHitbox,
      this.enemyGroup,
      (_hb, enemySprite) => {
        const e = this.enemies.find(e => e.sprite === enemySprite);
        if (e?.isAlive()) {
          e.takeDamage(1);
          if (!e.isAlive()) this.addScore(e.getScore());
        }
      },
    );

    // Contacto enemigo → jugador
    this.physics.add.overlap(
      this.player.sprite,
      this.enemyGroup,
      (_ps, enemySprite) => {
        const e = this.enemies.find(e => e.sprite === enemySprite);
        if (e?.isAlive()) this.hurtPlayer(e.getDamage());
      },
    );

    // Jugador → estrella
    this.physics.add.overlap(
      this.player.sprite,
      this.star.sensor,
      () => this.star.collect(),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VICTORIA
  // ─────────────────────────────────────────────────────────────────────────

  private triggerVictory() {
    if (this.paused) return;
    this.paused = true;

    this.cameras.main.shake(200, 0.006);

    // Panel de victoria aparece 600ms después (para ver la animación de la estrella)
    this.time.delayedCall(600, () => this.showVictoryPanel());
  }

  private showVictoryPanel() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Overlay oscuro
    const overlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.65)
      .setDepth(40).setScrollFactor(0).setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

    // Contenedor centrado
    const panel = this.add.container(cx, cy + 40).setDepth(50).setScrollFactor(0);

    // Fondo del panel
    panel.add(this.add.rectangle(0, 0, 360, 220, 0x0d0d1a, 0.95));
    panel.add(this.add.rectangle(0, 0, 360, 220).setStrokeStyle(2, 0xf5a623, 1).setFillStyle());

    // Título
    panel.add(this.add.text(0, -78, '★  ¡NIVEL COMPLETO!  ★', {
      fontFamily: 'monospace',
      fontSize:   '16px',
      color:      '#f5a623',
      stroke:     '#000',
      strokeThickness: 4,
    }).setOrigin(0.5));

    // Nombre del nivel
    panel.add(this.add.text(0, -48, this.levelData.name, {
      fontFamily: 'monospace',
      fontSize:   '12px',
      color:      '#4ecdc4',
    }).setOrigin(0.5));

    // Score
    panel.add(this.add.text(0, -14, `PUNTUACIÓN: ${this.score}`, {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#ffffff',
    }).setOrigin(0.5));

    // Vidas restantes
    const hearts = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, 3 - this.lives));
    panel.add(this.add.text(0, 14, hearts, {
      fontFamily: 'monospace',
      fontSize:   '14px',
    }).setOrigin(0.5));

    // Botones
    const hasNext = this.levelData.nextLevel !== undefined;

    if (hasNext) {
      this.addPanelButton(panel, -70, 60, 'SIGUIENTE NIVEL ▶', 0x4ecdc4, () => {
        this.cameras.main.fadeOut(350, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { level: this.levelData.nextLevel });
        });
      });
    }

    this.addPanelButton(panel, hasNext ? 70 : 0, 60, '☰ NIVELES', 0xf5a623, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelectScene');
      });
    });

    // Animación de entrada del panel
    this.tweens.add({
      targets:  panel,
      y:        cy,
      duration: 400,
      ease:     'Back.easeOut',
    });

    // Confeti
    this.spawnConfetti(width, height);
  }

  private addPanelButton(
    panel:   GameObjects.Container,
    x:       number,
    y:       number,
    label:   string,
    color:   number,
    onPress: () => void,
  ) {
    const w = 150, h = 40;
    const btn = this.add.container(x, y);

    btn.add(this.add.rectangle(2, 2, w, h, 0x000000, 0.5));
    const bg = this.add.rectangle(0, 0, w, h, color, 0.15);
    btn.add(bg);
    btn.add(this.add.rectangle(0, 0, w, h).setStrokeStyle(2, color, 1).setFillStyle());
    btn.add(this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
    }).setOrigin(0.5));

    panel.add(btn);

    // Hitarea en coordenadas de mundo (el panel se mueve, necesitamos compensar)
    const hit = this.add.rectangle(
      this.scale.width / 2 + x,
      this.scale.height / 2 + y,
      w, h, 0xffffff, 0,
    ).setDepth(51).setScrollFactor(0).setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => { bg.setFillStyle(color, 0.35); });
    hit.on('pointerout',  () => { bg.setFillStyle(color, 0.15); });
    hit.on('pointerdown', () => {
      this.tweens.add({ targets: btn, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true });
      this.time.delayedCall(160, onPress);
    });
  }

  private spawnConfetti(width: number, height: number) {
    const colors = [0xf5a623, 0xe94560, 0x4ecdc4, 0xffffff, 0xffe566];
    for (let i = 0; i < 40; i++) {
      const x     = PMath.Between(0, width);
      const color = colors[PMath.Between(0, colors.length - 1)];
      const dot   = this.add.rectangle(x, -10, PMath.Between(4, 8), PMath.Between(4, 8), color)
        .setDepth(45).setScrollFactor(0);
      this.tweens.add({
        targets:  dot,
        y:        height + 20,
        x:        x + PMath.Between(-60, 60),
        angle:    PMath.Between(-180, 180),
        duration: PMath.Between(1200, 2500),
        delay:    PMath.Between(0, 800),
        ease:     'Power1',
        onComplete: () => dot.destroy(),
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DAÑO Y SCORE
  // ─────────────────────────────────────────────────────────────────────────

  private hurtPlayer(damage: number) {
    if (this.playerInvincible || this.paused) return;
    this.lives -= damage;
    this.playerInvincible = true;

    this.tweens.add({
      targets: this.player.sprite, alpha: 0.3,
      duration: 100, yoyo: true, repeat: 7,
      onComplete: () => {
        this.player.sprite.setAlpha(1);
        this.playerInvincible = false;
      },
    });

    (this.player.sprite.body as Physics.Arcade.Body).setVelocityY(-200);
    this.cameras.main.shake(150, 0.008);
    if (this.lives <= 0) this.gameOver();
  }

  private addScore(points: number) {
    this.score += points;
    const popup = this.add.text(this.player.x, this.player.y - 30, `+${points}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#f5a623',
      stroke: '#000', strokeThickness: 3,
    }).setDepth(20);
    this.tweens.add({
      targets: popup, y: popup.y - 40, alpha: 0,
      duration: 700, ease: 'Power2',
      onComplete: () => popup.destroy(),
    });
  }

  private gameOver() {
    this.paused = true;
    this.cameras.main.fadeOut(500, 50, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────────────────────────────────────

  private createHUD(width: number) {
    const bar = this.add.graphics().setScrollFactor(0).setDepth(9);
    bar.fillStyle(0x000000, 0.4);
    bar.fillRect(0, 0, width, 68);

    const base = { fontFamily: 'monospace', stroke: '#000', strokeThickness: 3 };

    this.add.text(width / 2, 10, `NIVEL ${this.currentLevel}: ${this.levelData.name}`, {
      ...base, fontSize: '12px', color: '#f5a623',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

    this.hudScore = this.add.text(12, 10, 'SCORE: 0', {
      ...base, fontSize: '12px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(10);

    this.hudLives = this.add.text(12, 28, '', {
      ...base, fontSize: '13px', color: '#e94560',
    }).setScrollFactor(0).setDepth(10);

    this.hudJumps = this.add.text(12, 48, '', {
      ...base, fontSize: '11px', color: '#4ecdc4', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(10);

    this.add.text(width - 12, 48, '← → Mover  ↑ Saltar(x2)  Z Golpear', {
      fontFamily: 'monospace', fontSize: '10px', color: '#444466',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);
  }

  private createMenuButton(width: number) {
    const btn = this.add.text(width - 12, 12, '⏸ MENÚ', {
      fontFamily: 'monospace', fontSize: '11px', color: '#555577',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ color: '#4ecdc4' }));
    btn.on('pointerout',  () => btn.setStyle({ color: '#555577' }));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }

  private updateHUD() {
    this.hudScore.setText(`SCORE: ${this.score}`);
    this.hudLives.setText('❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, 3 - this.lives)));
    const dots = Array.from({ length: 2 }, (_, i) => i < this.player.jumps ? '◆' : '◇').join(' ');
    this.hudJumps.setText(`Saltos: ${dots}  Estado: ${this.player.currentState}`);
  }
}
