import { Scene, GameObjects, Math as PMath } from 'phaser';
import { PALETTE } from './transitions/MenuScene';
import { getLevel, LEVEL_IDS } from '../data/Levels/Index';

// ─── Configuración visual por nivel ───────────────────────────────────────
// Solo lo que NO está en LevelData: color de tarjeta y estado unlocked.
// Cuando implementes un sistema de save, reemplazá `unlocked` con
// una lectura de localStorage o tu backend.
interface LevelCardMeta {
  color:    number;
  unlocked: boolean;
}

const LEVEL_META: Record<number, LevelCardMeta> = {
  1: { color: PALETTE.accent, unlocked: true  },
  2: { color: PALETTE.gold,   unlocked: true  },
  3: { color: 0x9b59b6,       unlocked: true  },
  4: { color: 0x00e5cc,       unlocked: true  },
  5: { color: 0xffd700,       unlocked: true  },
  6: { color: 0x7fdbff,       unlocked: true  },
  7: { color: 0xc8a46e,       unlocked: true  },
  8: { color: 0xeefcfc,       unlocked: true  },
};

// Construimos la lista de tarjetas desde el registry — sin duplicar datos
interface LevelConfig {
  id:          number;
  name:        string;
  description: string;
  unlocked:    boolean;
  color:       number;
}

function buildLevelList(): LevelConfig[] {
  return LEVEL_IDS.map(id => {
    const data = getLevel(id);
    const meta = LEVEL_META[id] ?? { color: 0x555577, unlocked: false };
    return {
      id,
      name:        `NIVEL ${id}`,
      description: data.name,
      unlocked:    meta.unlocked,
      color:       meta.color,
    };
  });
}

// ─── Escena ────────────────────────────────────────────────────────────────
export class LevelSelectScene extends Scene {

  private selectedLevel: LevelConfig | null = null;
  private infoPanel!: GameObjects.Container;
  private infoPanelText!: GameObjects.Text;
  private infoPanelDesc!: GameObjects.Text;
  private playBtn!: GameObjects.Container;
  private playBtnHit!: GameObjects.Rectangle;

  constructor() { super({ key: 'LevelSelectScene' }); }

  // ── create ───────────────────────────────────────────────────────────────
  create() {
    const { width, height } = this.scale;

    this.createBackground(width, height);
    this.createHeader(width);
    this.createLevelGrid(width, height);
    this.createInfoPanel(width, height);
    this.createBackButton();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTRUCCIÓN
  // ─────────────────────────────────────────────────────────────────────────

  private createBackground(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(PALETTE.dark, PALETTE.dark, PALETTE.bg1, PALETTE.bg2, 1);
    bg.fillRect(0, 0, width, height);

    // Grid decorativa de fondo
    bg.lineStyle(1, PALETTE.accent, 0.05);
    const step = 40;
    for (let x = 0; x < width; x += step)  bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += step) bg.lineBetween(0, y, width, y);
  }

  private createHeader(width: number) {
    // Barra superior
    const bar = this.add.graphics();
    bar.fillStyle(PALETTE.dark, 0.8);
    bar.fillRect(0, 0, width, 70);
    bar.lineStyle(1, PALETTE.accent, 0.4);
    bar.lineBetween(0, 70, width, 70);

    this.add.text(width / 2, 35, 'SELECCIONAR NIVEL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '18px',
      color:      '#f5a623',
      stroke:     '#e94560',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setAlpha(0);

    // Fade-in del header
    this.tweens.add({
      targets:  this.children.list[this.children.list.length - 1],
      alpha:    1,
      y:        { from: 20, to: 35 },
      duration: 500,
      ease:     'Back.easeOut',
    });
  }

  private createLevelGrid(width: number, height: number) {
    const levels  = buildLevelList();
    const cols    = 3;
    const cardW   = 150;
    const cardH   = 110;
    const gapX    = 20;
    const gapY    = 20;
    const rows    = Math.ceil(levels.length / cols);
    const totalW  = cols * cardW + (cols - 1) * gapX;
    const totalH  = rows * cardH + (rows - 1) * gapY;
    const startX  = (width - totalW)  / 2 + cardW / 2;
    const startY  = 70 + (height - 70 - 180 - totalH) / 2 + cardH / 2;

    levels.forEach((level, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x   = startX + col * (cardW + gapX);
      const y   = startY + row * (cardH + gapY);

      this.createLevelCard(level, x, y, cardW, cardH, i * 60);
    });
  }

  private createLevelCard(
    level: LevelConfig,
    x: number, y: number,
    w: number, h: number,
    delay: number,
  ) {
    const container = this.add.container(x, y).setAlpha(0);

    const color   = level.unlocked ? level.color : 0x333355;
    const textCol = level.unlocked ? '#ffffff'   : '#555577';

    // Sombra
    container.add(this.add.rectangle(3, 4, w, h, 0x000000, 0.4));
    // Fondo
    const bg = this.add.rectangle(0, 0, w, h, color, level.unlocked ? 0.12 : 0.06);
    container.add(bg);
    // Borde
    container.add(this.add.rectangle(0, 0, w, h).setStrokeStyle(2, color, level.unlocked ? 0.8 : 0.3).setFillStyle());
    // Número grande
    container.add(this.add.text(0, -16, level.unlocked ? String(level.id) : '🔒', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '28px',
      color:      level.unlocked ? `#${color.toString(16).padStart(6, '0')}` : '#444466',
    }).setOrigin(0.5, 0.5));
    // Nombre
    container.add(this.add.text(0, 22, level.name, {
      fontFamily: 'monospace',
      fontSize:   '11px',
      color:      textCol,
      letterSpacing: 2,
    }).setOrigin(0.5, 0.5));
    // Descripción
    container.add(this.add.text(0, 38, level.description, {
      fontFamily: 'monospace',
      fontSize:   '9px',
      color:      level.unlocked ? '#aaaacc' : '#444455',
    }).setOrigin(0.5, 0.5));

    // Animación de entrada
    this.tweens.add({
      targets:  container,
      alpha:    1,
      y:        { from: y + 20, to: y },
      duration: 400,
      delay,
      ease:     'Back.easeOut',
    });

    if (!level.unlocked) return; // Sin interactividad si está bloqueado

    // Hitarea
    const hit = this.add.rectangle(x, y, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 120, ease: 'Power1' });
      bg.setFillStyle(color, 0.25);
      this.selectLevel(level);
    });

    hit.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120, ease: 'Power1' });
      bg.setFillStyle(color, 0.12);
    });

    hit.on('pointerdown', () => {
      this.tweens.add({
        targets: container, scaleX: 0.95, scaleY: 0.95,
        duration: 80, yoyo: true, ease: 'Power1',
      });
    });
  }

  // ─── Panel inferior con info del nivel seleccionado ──────────────────────

  private createInfoPanel(width: number, height: number) {
    const panelH = 130;
    const y      = height - panelH;

    this.infoPanel = this.add.container(0, y);

    // Fondo del panel
    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.dark, 0.9);
    bg.fillRect(0, 0, width, panelH);
    bg.lineStyle(1, PALETTE.accent, 0.3);
    bg.lineBetween(0, 0, width, 0);
    this.infoPanel.add(bg);

    // Texto nivel seleccionado
    this.infoPanelText = this.add.text(24, 22, 'Seleccioná un nivel para comenzar', {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#4ecdc4',
      letterSpacing: 1,
    });
    this.infoPanel.add(this.infoPanelText);

    this.infoPanelDesc = this.add.text(24, 46, '', {
      fontFamily: 'monospace',
      fontSize:   '11px',
      color:      '#888899',
    });
    this.infoPanel.add(this.infoPanelDesc);

    // Botón Jugar (oculto hasta que se seleccione un nivel)
    this.playBtn    = this.createPlayButton(width - 200, 65);
    this.playBtnHit = this.add.rectangle(width - 140, y + 65, 160, 44, 0xffffff, 0);
    this.infoPanel.add(this.playBtn);
    this.playBtn.setVisible(false);

    // El hitarea va fuera del container para que las coords sean absolutas
    this.playBtnHit
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    this.playBtnHit.on('pointerdown', () => this.launchLevel());
    this.playBtnHit.on('pointerover', () => {
      this.tweens.add({ targets: this.playBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });
    this.playBtnHit.on('pointerout', () => {
      this.tweens.add({ targets: this.playBtn, scaleX: 1, scaleY: 1, duration: 100 });
    });
  }

  private createPlayButton(x: number, y: number): GameObjects.Container {
    const w = 160, h = 44;
    const c = this.add.container(x, y);
    c.add(this.add.rectangle(2, 3, w, h, 0x000000, 0.5));
    c.add(this.add.rectangle(0, 0, w, h, PALETTE.accent, 0.2));
    c.add(this.add.rectangle(0, 0, w, h).setStrokeStyle(2, PALETTE.accent, 1).setFillStyle());
    c.add(this.add.text(0, 0, '▶  JUGAR', {
      fontFamily: 'monospace',
      fontSize:   '13px',
      color:      '#ffffff',
    }).setOrigin(0.5, 0.5));
    return c;
  }

  private selectLevel(level: LevelConfig) {
    this.selectedLevel = level;
    this.infoPanelText.setText(`${level.name}  —  ${level.description}`);
    this.infoPanelText.setStyle({ color: `#${level.color.toString(16).padStart(6, '0')}` });
    this.infoPanelDesc.setText('Haz click en JUGAR para comenzar este nivel');
    this.playBtn.setVisible(true);
    this.playBtnHit.setVisible(true);
  }

  private launchLevel() {
    if (!this.selectedLevel) return;
    const id = this.selectedLevel.id;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { level: id });
    });
  }

  // ─── Botón Volver ─────────────────────────────────────────────────────────

  private createBackButton() {
    const btn = this.add.text(20, 20, '← VOLVER', {
      fontFamily: 'monospace',
      fontSize:   '12px',
      color:      '#666688',
      stroke:     '#000000',
      strokeThickness: 2,
    }).setInteractive({ useHandCursor: true });

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
