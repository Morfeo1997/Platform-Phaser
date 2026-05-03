import type { LevelData } from './LevelData';

// ─── Nivel 2: Zona Volcánica ──────────────────────────────────────────────
// Plataformas más angostas y separadas — exigen doble salto.
// Enemigos: slimes en suelo y bats en el aire.
// La estrella está en lo alto, rodeada de bats.

const Lv2: LevelData = {
  id:   2,
  name: 'Zona Volcánica',

  bgColors:     [0x1a0a00, 0x2d0e00, 0x3d1200, 0x1a0500],
  platformTop:  0xff6b35,
  platformBody: 0x6b2800,
  groundTop:    0xff4500,
  groundBody:   0x3d1200,

  backgroundEffect: 'lava',

  playerSpawn:  { x: 0.08, y: 0.85 },

  // Estrella en la cima — hay que superar a los bats para llegar
  goalPosition: { x: 0.62, y: 0.19 },

  nextLevel: undefined, // último nivel por ahora

  platforms: [
    { x: 0.25, y: 0.76, width: 120 },
    { x: 0.50, y: 0.62, width: 100 },
    { x: 0.72, y: 0.50, width: 120 },
    { x: 0.38, y: 0.38, width: 100 },
    { x: 0.62, y: 0.26, width: 110 }, // ← estrella aquí
    { x: 0.18, y: 0.46, width: 100 },
    { x: 0.88, y: 0.70, width: 100 },
  ],

  enemies: [
    { type: 'slime', x: 0.25, y: 0.70 },
    { type: 'slime', x: 0.72, y: 0.44 },
    { type: 'bat',   x: 0.50, y: 0.35 },
    { type: 'bat',   x: 0.80, y: 0.20 },
    { type: 'slime', x: 0.62, y: 0.20 },
  ],
};

export default Lv2;
