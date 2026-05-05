import type { LevelData } from './LevelData';

// ─── Nivel 6: Torres de Hielo ─────────────────────────────────────────────
// El mapa está dividido en 3 torres verticales de plataformas agrupadas.
// Los gaps HORIZONTALES entre torres son muy amplios — imposibles de cruzar
// en un solo salto desde el suelo, hay que subir primero para tener altura.
// Mecánica central: ganar altitud dentro de una torre antes de cruzar a la siguiente.
// Bats dominan el espacio aéreo entre torres.

const Lv6: LevelData = {
  id:   6,
  name: 'Torres de Hielo',

  bgColors:     [0x00101f, 0x001428, 0x000c18, 0x000810],
  platformTop:  0x7fdbff,
  platformBody: 0x1a5c7a,
  groundTop:    0x4fc3e8,
  groundBody:   0x0d3a50,

  backgroundEffect: 'none',

  playerSpawn: { x: 0.07, y: 0.85 },

  // Estrella en lo alto de la torre derecha
  goalPosition: { x: 0.87, y: 0.10 },

  nextLevel: 7,

  platforms: [
    // ── Torre izquierda (x ≈ 0.12–0.22) ─────────────────────────────────
    { x: 0.17, y: 0.74, width: 90 },  // base de la torre
    { x: 0.12, y: 0.60, width: 75 },  // peldaño 2 (alternado para forzar movimiento)
    { x: 0.22, y: 0.47, width: 75 },  // peldaño 3
    { x: 0.14, y: 0.33, width: 80 },  // cima de la torre izquierda

    // ── Puente central angosto (transición torre izq → torre central) ────
    // Solo accesible desde la cima de la torre izquierda con doble salto
    { x: 0.38, y: 0.40, width: 65 },

    // ── Torre central (x ≈ 0.47–0.57) ────────────────────────────────────
    { x: 0.47, y: 0.55, width: 80 },  // base de la torre central
    { x: 0.57, y: 0.42, width: 70 },  // peldaño 2
    { x: 0.48, y: 0.29, width: 75 },  // peldaño 3
    { x: 0.56, y: 0.17, width: 70 },  // cima de la torre central

    // ── Puente central-derecha ────────────────────────────────────────────
    { x: 0.73, y: 0.24, width: 65 },

    // ── Torre derecha (x ≈ 0.82–0.93) ─────────────────────────────────────
    { x: 0.85, y: 0.37, width: 80 },  // base de la torre derecha
    { x: 0.92, y: 0.24, width: 70 },  // peldaño 2
    { x: 0.83, y: 0.13, width: 85 },  // cima — estrella aquí
  ],

  enemies: [
    // Guardias de la torre izquierda
    { type: 'slime', x: 0.17, y: 0.68 },
    { type: 'slime', x: 0.22, y: 0.41 },

    // Bats patrullando el abismo entre torres (zona más peligrosa)
    { type: 'bat', x: 0.32, y: 0.50 }, // entre torre izq y puente
    { type: 'bat', x: 0.42, y: 0.30 }, // sobre el puente central
    { type: 'bat', x: 0.65, y: 0.38 }, // entre torre central y derecha

    // Guardias de la torre central
    { type: 'slime', x: 0.47, y: 0.49 },
    { type: 'bat',   x: 0.52, y: 0.22 },

    // Guardias de la torre derecha
    { type: 'slime', x: 0.85, y: 0.31 },
    { type: 'bat',   x: 0.88, y: 0.17 }, // guardián de la estrella
    { type: 'bat',   x: 0.78, y: 0.13 }, // segundo guardián
  ],
};

export default Lv6;
