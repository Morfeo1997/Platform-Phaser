import Phaser from 'phaser';

// ─── Constantes del juego ──────────────────────────────────────────────────
const PLAYER_SPEED = 200;
const JUMP_VELOCITY = -480;
const GRAVITY = 800;
const MAX_JUMPS = 2;
const ATTACK_DURATION = 350; // ms que dura la animación de golpe

// ─── Tipos internos ────────────────────────────────────────────────────────
type PlayerState = 'idle' | 'run' | 'jump' | 'fall' | 'attack';

// ─── Escena principal ──────────────────────────────────────────────────────
export class PlatformerScene extends Phaser.Scene {
  // Objetos de juego
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private attackHitbox!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody };

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;

  // Estado del jugador
  private jumpsLeft = MAX_JUMPS;
  private isAttacking = false;
  private attackTimer = 0;
  private facingRight = true;
  private currentState: PlayerState = 'idle';

  // HUD
  private jumpText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PlatformerScene' });
  }

  // ── preload ──────────────────────────────────────────────────────────────
  preload(): void {
    // Generamos gráficos proceduralmente — no se necesitan assets externos.
    // Si en el futuro querés agregar sprites, cargalos aquí con:
    //   this.load.spritesheet('player', 'assets/player.png', { frameWidth: 48, frameHeight: 48 });
  }

  // ── create ───────────────────────────────────────────────────────────────
  create(): void {
    const { width, height } = this.scale;

    this.createBackground(width, height);
    this.createPlatforms(width, height);
    this.createPlayer(width, height);
    this.createAttackHitbox();
    this.createAnimations();
    this.createInput();
    this.createHUD(width);
    this.createColliders();
  }

  // ── update ───────────────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    this.handleAttackTimer(delta);
    this.handleMovement();
    this.handleJump();
    this.handleAttack();
    this.updateAttackHitbox();
    this.updateAnimation();
    this.updateHUD();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREACIÓN DE OBJETOS
  // ─────────────────────────────────────────────────────────────────────────

  private createBackground(width: number, height: number): void {
    // Degradado de cielo pixel-art pintado sobre un rectángulo
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
    bg.fillRect(0, 0, width, height);

    // Estrellas decorativas
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.7);
      const size = Math.random() < 0.3 ? 2 : 1;
      const alpha = Phaser.Math.FloatBetween(0.4, 1);
      bg.fillStyle(0xffffff, alpha);
      bg.fillRect(x, y, size, size);
    }
  }

  private createPlatforms(width: number, height: number): void {
    this.platforms = this.physics.add.staticGroup();

    const platformData = [
      // [x, y, w, h]  — x,y = centro de la plataforma
      { x: width / 2, y: height - 20, w: width, h: 40 },   // suelo
      { x: 150,       y: height - 160, w: 200, h: 24 },
      { x: width / 2, y: height - 260, w: 220, h: 24 },
      { x: width - 150, y: height - 200, w: 200, h: 24 },
      { x: 300,       y: height - 370, w: 180, h: 24 },
      { x: width - 200, y: height - 400, w: 150, h: 24 },
    ];

    platformData.forEach(({ x, y, w, h }) => {
      const gfx = this.add.graphics();
      // Borde superior iluminado
      gfx.fillStyle(0x4ecdc4, 1);
      gfx.fillRect(-w / 2, -h / 2, w, 4);
      // Cuerpo de la plataforma
      gfx.fillStyle(0x2d6a4f, 1);
      gfx.fillRect(-w / 2, -h / 2 + 4, w, h - 4);

      const tex = gfx.generateTexture(`platform_${x}_${y}`, w, h);
      gfx.destroy();

      const platform = this.platforms.create(x, y, `platform_${x}_${y}`) as Phaser.Physics.Arcade.Sprite;
      platform.setImmovable(true);
      platform.refreshBody();
    });
  }

  private createPlayer(width: number, height: number): void {
    // Sprite del jugador dibujado proceduralmente
    const g = this.add.graphics();
    this.drawPlayerFrames(g);
    g.destroy();

    this.player = this.physics.add.sprite(width / 2, height - 80, 'player_idle');
    this.player.setCollideWorldBounds(true);

    // Ajuste de hitbox del jugador (más pequeña que el sprite para mejor feel)
    this.player.body!.setSize(28, 44);
    this.player.body!.setOffset(10, 8);

    // Gravedad personalizada
    (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(GRAVITY);
  }

  /** Dibuja todos los frames del jugador como texturas únicas */
  private drawPlayerFrames(g: Phaser.GameObjects.Graphics): void {
    const frames: Record<string, (g: Phaser.GameObjects.Graphics) => void> = {
      player_idle:   this.drawBodyIdle.bind(this),
      player_run1:   this.drawBodyRun1.bind(this),
      player_run2:   this.drawBodyRun2.bind(this),
      player_jump:   this.drawBodyJump.bind(this),
      player_fall:   this.drawBodyFall.bind(this),
      player_attack: this.drawBodyAttack.bind(this),
    };

    for (const [key, drawFn] of Object.entries(frames)) {
      g.clear();
      drawFn(g);
      g.generateTexture(key, 48, 60);
    }
  }

  // ── Frames del jugador (pixel-art procedural) ───────────────────────────

  private drawBodyBase(g: Phaser.GameObjects.Graphics): void {
    // Cuerpo principal
    g.fillStyle(0xe94560, 1);
    g.fillRect(10, 8, 28, 28);  // torso

    // Cabeza
    g.fillStyle(0xf5a623, 1);
    g.fillRect(12, 0, 24, 20);
    // Ojos
    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(16, 5, 5, 5);
    g.fillRect(26, 5, 5, 5);
    // Boca
    g.fillRect(19, 13, 9, 3);
  }

  private drawBodyIdle(g: Phaser.GameObjects.Graphics): void {
    this.drawBodyBase(g);
    // Piernas
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(12, 36, 10, 20);
    g.fillRect(26, 36, 10, 20);
    // Brazos
    g.fillStyle(0xe94560, 1);
    g.fillRect(4, 12, 8, 18);
    g.fillRect(36, 12, 8, 18);
  }

  private drawBodyRun1(g: Phaser.GameObjects.Graphics): void {
    this.drawBodyBase(g);
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(12, 36, 10, 16);
    g.fillRect(26, 36, 10, 24);
    g.fillStyle(0xe94560, 1);
    g.fillRect(4, 10, 8, 16);
    g.fillRect(36, 14, 8, 16);
  }

  private drawBodyRun2(g: Phaser.GameObjects.Graphics): void {
    this.drawBodyBase(g);
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(12, 36, 10, 24);
    g.fillRect(26, 36, 10, 16);
    g.fillStyle(0xe94560, 1);
    g.fillRect(4, 14, 8, 16);
    g.fillRect(36, 10, 8, 16);
  }

  private drawBodyJump(g: Phaser.GameObjects.Graphics): void {
    this.drawBodyBase(g);
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(10, 36, 12, 14);
    g.fillRect(26, 36, 12, 14);
    g.fillStyle(0xe94560, 1);
    g.fillRect(2, 8, 10, 14);
    g.fillRect(36, 8, 10, 14);
  }

  private drawBodyFall(g: Phaser.GameObjects.Graphics): void {
    this.drawBodyBase(g);
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(10, 36, 12, 20);
    g.fillRect(26, 36, 12, 20);
    g.fillStyle(0xe94560, 1);
    g.fillRect(2, 14, 10, 18);
    g.fillRect(36, 14, 10, 18);
  }

  private drawBodyAttack(g: Phaser.GameObjects.Graphics): void {
    this.drawBodyBase(g);
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(12, 36, 10, 20);
    g.fillRect(26, 36, 10, 20);
    // Brazo extendido de ataque
    g.fillStyle(0xe94560, 1);
    g.fillRect(4, 12, 6, 14);
    g.fillRect(36, 10, 16, 10); // brazo extendido
    // Puño
    g.fillStyle(0xf5a623, 1);
    g.fillRect(50, 8, 10, 14);
  }

  private createAttackHitbox(): void {
    // Rectángulo invisible que representa el área de daño del golpe
    this.attackHitbox = this.add.rectangle(0, 0, 50, 40, 0xffff00, 0) as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody };
    this.physics.add.existing(this.attackHitbox, true); // true = cuerpo estático
    this.attackHitbox.setVisible(false); // Poné true para debug visual
  }

  private createAnimations(): void {
    const anims: Phaser.Types.Animations.Animation[] = [
      {
        key: 'idle',
        frames: [{ key: 'player_idle' }],
        frameRate: 4,
        repeat: -1,
      },
      {
        key: 'run',
        frames: [
          { key: 'player_run1' },
          { key: 'player_run2' },
        ],
        frameRate: 10,
        repeat: -1,
      },
      {
        key: 'jump',
        frames: [{ key: 'player_jump' }],
        frameRate: 4,
        repeat: -1,
      },
      {
        key: 'fall',
        frames: [{ key: 'player_fall' }],
        frameRate: 4,
        repeat: -1,
      },
      {
        key: 'attack',
        frames: [{ key: 'player_attack' }],
        frameRate: 4,
        repeat: -1,
      },
    ];

    anims.forEach(anim => {
      if (!this.anims.exists(anim.key as string)) {
        this.anims.create(anim);
      }
    });
  }

  private createInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.Z
    );
  }

  private createHUD(width: number): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#4ecdc4',
      stroke: '#000000',
      strokeThickness: 3,
    };

    this.jumpText = this.add.text(12, 12, '', style).setScrollFactor(0).setDepth(10);
    this.stateText = this.add.text(12, 32, '', style).setScrollFactor(0).setDepth(10);

    // Controles
    const controlsStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2,
    };
    this.add.text(12, width > 600 ? 56 : 52,
      '← → Mover  |  ↑ / ESPACIO Saltar (2x)  |  Z Golpear',
      controlsStyle
    ).setScrollFactor(0).setDepth(10);
  }

  private createColliders(): void {
    this.physics.add.collider(this.player, this.platforms);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LÓGICA DE UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  private handleAttackTimer(delta: number): void {
    if (this.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackTimer = 0;
        // Ocultamos el hitbox al terminar el ataque
        this.attackHitbox.setVisible(false);
      }
    }
  }

  private handleMovement(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

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
  }

  private handleJump(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.cursors.space!);

    // Reseteamos los saltos disponibles al tocar el suelo
    if (onGround) {
      this.jumpsLeft = MAX_JUMPS;
    }

    if (jumpPressed && this.jumpsLeft > 0) {
      body.setVelocityY(JUMP_VELOCITY);
      this.jumpsLeft--;

      // Efecto visual de doble salto
      if (this.jumpsLeft === 0) {
        this.createDoubleJumpEffect();
      }
    }
  }

  private handleAttack(): void {
    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking) {
      this.isAttacking = true;
      this.attackTimer = ATTACK_DURATION;

      // Efecto visual del golpe
      this.createAttackEffect();
    }
  }

  private updateAttackHitbox(): void {
    if (this.isAttacking) {
      const offsetX = this.facingRight ? 44 : -44;
      this.attackHitbox.setPosition(
        this.player.x + offsetX,
        this.player.y
      );
      // Refresh del cuerpo estático para que detecte overlaps
      (this.attackHitbox.body as Phaser.Physics.Arcade.StaticBody).reset(
        this.player.x + offsetX,
        this.player.y
      );
    }
  }

  private updateAnimation(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const velocityX = body.velocity.x;
    const velocityY = body.velocity.y;

    let newState: PlayerState;

    if (this.isAttacking) {
      newState = 'attack';
    } else if (!onGround && velocityY < 0) {
      newState = 'jump';
    } else if (!onGround && velocityY > 0) {
      newState = 'fall';
    } else if (Math.abs(velocityX) > 10) {
      newState = 'run';
    } else {
      newState = 'idle';
    }

    if (newState !== this.currentState) {
      this.currentState = newState;
      this.player.play(newState);
    }
  }

  private updateHUD(): void {
    const jumpIndicator = Array.from({ length: MAX_JUMPS }, (_, i) =>
      i < this.jumpsLeft ? '◆' : '◇'
    ).join(' ');

    this.jumpText.setText(`Saltos: ${jumpIndicator}`);
    this.stateText.setText(`Estado: ${this.currentState}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EFECTOS VISUALES
  // ─────────────────────────────────────────────────────────────────────────

  private createDoubleJumpEffect(): void {
    // Anillo de partículas para el doble salto
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 120);
      const particle = this.add.rectangle(
        this.player.x,
        this.player.y + 20,
        6, 6,
        0x4ecdc4
      );

      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createAttackEffect(): void {
    // Flash de golpe delante del jugador
    const offsetX = this.facingRight ? 50 : -50;
    const flash = this.add.graphics();
    flash.fillStyle(0xffdd00, 0.9);

    // Forma de estrella de golpe
    const cx = this.player.x + offsetX;
    const cy = this.player.y;
    const spikes = 5;
    const outerR = 22;
    const innerR = 10;

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }

    flash.fillPoints(points, true);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: ATTACK_DURATION * 0.8,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });

    // Pequeño shake de cámara
    this.cameras.main.shake(80, 0.004);
  }
}
