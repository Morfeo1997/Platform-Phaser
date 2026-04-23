import { Scene, Physics, GameObjects, Math as PMath } from 'phaser';
import { Player } from '../entities/Player';
import type { SlimeEnemy } from '../entities/Enemy';

// ─── Datos que recibe esta escena (pasados por scene.start) ───────────────
interface GameSceneData {
  level?: number;
}

// ─── Escena de juego ──────────────────────────────────────────────────────
export class GameScene extends Scene {
  // Entidades
  private player!:   Player;
  private enemies:   SlimeEnemy[] = [];
  private platforms!: Physics.Arcade.StaticGroup;

  // HUD
  private jumpText!:  GameObjects.Text;
  private stateText!: GameObjects.Text;
  private levelText!: GameObjects.Text;

  // Datos del nivel recibidos desde MenuScene o LevelSelectScene
  private currentLevel = 1;

  constructor() { super({ key: 'GameScene' }); }

  // ── init ─────────────────────────────────────────────────────────────────
  // init se ejecuta antes de preload/create y recibe los datos de scene.start()
  init(data: GameSceneData) {
    this.currentLevel = data.level ?? 1;
    this.enemies = []; // limpiar entre niveles
  }

  // ── preload ──────────────────────────────────────────────────────────────
  preload() {
    // Cargá tus sprites reales acá cuando los tengas:
    //   this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 48, frameHeight: 60 });
    //   this.load.image('platform', 'assets/sprites/platform.png');
    //   this.load.audio('jump', 'assets/sounds/jump.wav');
  }

  // ── create ───────────────────────────────────────────────────────────────
  create() {
    const { width, height } = this.scale;

    this.createBackground(width, height);
    this.generatePlatformTextures(width);
    this.createPlatforms(width, height);

    // Player — ahora toda la lógica del jugador vive en entities/Player.ts
    this.player = new Player(this, width / 2, height - 80);

    this.createEnemies();
    this.setupColliders();
    this.createHUD();
    this.createPauseButton(width);

    // Fade in al entrar a la escena
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ── update ───────────────────────────────────────────────────────────────
  update(_t: number, delta: number) {
    // Delegar toda la lógica del jugador
    this.player.update(delta);

    // Actualizar enemigos
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) enemy.update(delta, this.player.x);
    }

    // HUD
    const dots = Array.from(
      { length: 2 },
      (_, i) => i < this.player.jumps ? '◆' : '◇',
    ).join(' ');
    this.jumpText.setText(`Saltos: ${dots}`);
    this.stateText.setText(`Estado: ${this.player.currentState}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SETUP DE ESCENA
  // ─────────────────────────────────────────────────────────────────────────

  private createBackground(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
    bg.fillRect(0, 0, width, height);

    // Estrellas de fondo
    for (let i = 0; i < 60; i++) {
      const x = PMath.Between(0, width);
      const y = PMath.Between(0, height * 0.7);
      bg.fillStyle(0xffffff, PMath.FloatBetween(0.4, 1));
      bg.fillRect(x, y, Math.random() < 0.3 ? 2 : 1, Math.random() < 0.3 ? 2 : 1);
    }
  }

  private generatePlatformTextures(width: number) {
    if (!this.textures.exists('ground')) {
      const g = this.add.graphics();
      g.fillStyle(0x4ecdc4, 1); g.fillRect(0, 0, width, 4);
      g.fillStyle(0x1a5c3a, 1); g.fillRect(0, 4, width, 36);
      g.generateTexture('ground', width, 40);
      g.destroy();
    }
    if (!this.textures.exists('platform')) {
      const g = this.add.graphics();
      g.fillStyle(0x4ecdc4, 1); g.fillRect(0, 0, 220, 4);
      g.fillStyle(0x2d6a4f, 1); g.fillRect(0, 4, 220, 20);
      g.generateTexture('platform', 220, 24);
      g.destroy();
    }
  }

  private createPlatforms(width: number, height: number) {
    this.platforms = this.physics.add.staticGroup();

    const ground = this.platforms.create(width / 2, height - 20, 'ground') as Physics.Arcade.Sprite;
    ground.setImmovable(true).refreshBody();

    // Layout de plataformas — se puede externalizar a un JSON por nivel
    const layout = [
      { x: 150,         y: height - 160 },
      { x: width / 2,   y: height - 260 },
      { x: width - 150, y: height - 200 },
      { x: 300,         y: height - 370 },
      { x: width - 200, y: height - 400 },
    ];

    for (const pos of layout) {
      const p = this.platforms.create(pos.x, pos.y, 'platform') as Physics.Arcade.Sprite;
      p.setImmovable(true).refreshBody();
    }
  }

  private createEnemies() {
    // Importación dinámica para evitar dependencia circular si es necesario.
    // Por ahora importamos arriba y los creamos acá.
    // Los enemigos se pueden definir por nivel en un archivo de configuración:
    //   import { LEVEL_CONFIGS } from '../data/levels';
    //   const spawnPoints = LEVEL_CONFIGS[this.currentLevel].enemies;

    // Stub: sin enemigos en nivel 1, con slimes en nivel 2+
    if (this.currentLevel >= 2) {
      // Descomenta esto cuando tengas SlimeEnemy funcionando:
      // const { SlimeEnemy } = await import('../entities/Enemy');
      // this.enemies.push(new SlimeEnemy(this, 200, 300));
      // this.enemies.push(new SlimeEnemy(this, 550, 300));
    }
  }

  private setupColliders() {
    // Player vs plataformas
    this.physics.add.collider(this.player.sprite, this.platforms);

    // Hitbox de golpe vs enemigos (cuando los haya)
    // this.physics.add.overlap(
    //   this.player.attackHitbox,
    //   this.enemyGroup,
    //   (_, enemySprite) => { ... }
    // );
  }

  private createHUD() {
    const base = {
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 3,
    };

    this.levelText = this.add.text(12, 12, `NIVEL ${this.currentLevel}`, {
      ...base,
      fontSize: '12px',
      color: '#f5a623',
    }).setScrollFactor(0).setDepth(10);

    this.jumpText = this.add.text(12, 32, '', {
      ...base,
      fontSize: '13px',
      color: '#4ecdc4',
    }).setScrollFactor(0).setDepth(10);

    this.stateText = this.add.text(12, 50, '', {
      ...base,
      fontSize: '13px',
      color: '#4ecdc4',
    }).setScrollFactor(0).setDepth(10);

    this.add.text(12, 70, '← → Mover  |  ↑ Saltar (2x)  |  Z Golpear', {
      ...base,
      fontSize: '11px',
      color: '#666688',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(10);
  }

  private createPauseButton(width: number) {
    const btn = this.add.text(width - 16, 14, '⏸ MENÚ', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#666688',
      stroke: '#000',
      strokeThickness: 2,
    })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ color: '#4ecdc4' }));
    btn.on('pointerout',  () => btn.setStyle({ color: '#666688' }));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }
}
