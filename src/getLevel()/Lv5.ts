import type { LevelData } from './LevelData';

// ─── Nivel 5: La Cumbre Final ─────────────────────────────────────────────
// El nivel más difícil. Plataformas muy angostas y disposición caótica.
// Máxima densidad de enemigos — slimes y bats en todas las zonas.
// La estrella está en el centro absoluto del tope, rodeada de bats.
// No hay una ruta obvia: el jugador debe leer el mapa y planificar.

const Lv5: LevelData = {
  id:   5,
  name: 'La Cumbre Final',

  bgColors:     [0x1a1500, 0x2d2400, 0x1f1b00, 0x0d0b00],
  platformTop:  0xffd700,
  platformBody: 0x7a6000,
  groundTop:    0xffa500,
  groundBody:   0x5a3800,

  backgroundEffect: 'none',

  playerSpawn:  { x: 0.05, y: 0.85 },

  // Estrella al tope-centro exacto — obliga a cruzar toda la pantalla
  goalPosition: { x: 0.50, y: 0.08 },

  nextLevel: 6,

  // Layout caótico: sin patrón claro, múltiples rutas posibles,
  // ninguna completamente segura. Plataformas muy angostas (60–90px).
  platforms: [
    // Zona baja — dispersa, gaps irregulares
    { x: 0.20, y: 0.76, width:  80 },
    { x: 0.45, y: 0.80, width:  70 },
    { x: 0.70, y: 0.72, width:  80 },
    { x: 0.90, y: 0.78, width:  70 },

    // Zona media — más caótica, alturas irregulares
    { x: 0.12, y: 0.58, width:  70 },
    { x: 0.33, y: 0.64, width:  80 },
    { x: 0.58, y: 0.56, width:  70 },
    { x: 0.80, y: 0.61, width:  75 },

    // Zona alta — muy angostas, requieren precisión
    { x: 0.22, y: 0.42, width:  65 },
    { x: 0.45, y: 0.36, width:  60 },
    { x: 0.68, y: 0.43, width:  65 },
    { x: 0.88, y: 0.38, width:  60 },

    // Zona tope — plataformas de acceso a la estrella
    { x: 0.15, y: 0.24, width:  70 },
    { x: 0.38, y: 0.18, width:  60 },
    { x: 0.50, y: 0.14, width:  90 }, // ← estrella aquí
    { x: 0.72, y: 0.20, width:  60 },
  ],

  enemies: [
    // Zona baja: slimes en casi cada plataforma
    { type: 'slime', x: 0.20, y: 0.70 },
    { type: 'slime', x: 0.70, y: 0.66 },
    { type: 'slime', x: 0.90, y: 0.72 },

    // Zona media: mix denso
    { type: 'slime', x: 0.33, y: 0.58 },
    { type: 'slime', x: 0.58, y: 0.50 },
    { type: 'bat',   x: 0.15, y: 0.48 },
    { type: 'bat',   x: 0.75, y: 0.52 },

    // Zona alta: bats dominan
    { type: 'bat',   x: 0.30, y: 0.35 },
    { type: 'bat',   x: 0.60, y: 0.38 },
    { type: 'slime', x: 0.88, y: 0.32 },

    // Guardianes del tope — 3 bats custodiando la estrella
    { type: 'bat',   x: 0.38, y: 0.22 },
    { type: 'bat',   x: 0.50, y: 0.25 },
    { type: 'bat',   x: 0.68, y: 0.22 },
    { type: 'slime', x: 0.15, y: 0.18 },
  ],
};

export default Lv5;
