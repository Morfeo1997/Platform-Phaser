import type { LevelData } from './LevelData';

// ─── Nivel 1: Las Alturas ─────────────────────────────────────────────────
// Introducción suave — sin enemigos, plataformas amplias.
// La estrella está en la plataforma superior derecha.

const Lv1: LevelData = {
  id:   1,
  name: 'Las Alturas',

  bgColors:     [0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460],
  platformTop:  0x4ecdc4,
  platformBody: 0x2d6a4f,
  groundTop:    0x4ecdc4,
  groundBody:   0x1a5c3a,

  backgroundEffect: 'stars',

  playerSpawn:  { x: 0.10, y: 0.85 },

  // Estrella al final del recorrido, en la plataforma más alta derecha
  goalPosition: { x: 0.75, y: 0.14 },

  nextLevel: 2,

  platforms: [
    { x: 0.19, y: 0.68, width: 200 },
    { x: 0.50, y: 0.48, width: 220 },
    { x: 0.81, y: 0.60, width: 200 },
    { x: 0.37, y: 0.26, width: 180 },
    { x: 0.75, y: 0.20, width: 150 }, // ← estrella aquí
  ],

  enemies: [],
};

export default Lv1;
