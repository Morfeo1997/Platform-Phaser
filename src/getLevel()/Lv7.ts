import type { LevelData } from '../data/Levels/LevelData';

// ─── Nivel 7: Ruinas Antiguas ─────────────────────────────────────────────
// Layout asimétrico que simula una estructura derrumbada.
// Hay una ruta "obvia" por la derecha (más amplia pero con más enemigos)
// y una ruta "oculta" por la izquierda (plataformas más angostas, menos enemigos).
// Ambas convergen en la plataforma final donde está la estrella.
// Mecánica: el jugador debe elegir su ruta y comprometerse con ella.

const Lv7: LevelData = {
  id:   7,
  name: 'Ruinas Antiguas',

  bgColors:     [0x1a0f00, 0x261500, 0x1a0d00, 0x0d0700],
  platformTop:  0xc8a46e,
  platformBody: 0x6b4a1f,
  groundTop:    0xa07840,
  groundBody:   0x4a2e0a,

  backgroundEffect: 'none',

  playerSpawn: { x: 0.08, y: 0.85 },

  // Estrella en la plataforma central alta donde convergen ambas rutas
  goalPosition: { x: 0.50, y: 0.11 },

  nextLevel: 8,

  // Dos rutas paralelas — mundo ancho para que ambas vías tengan espacio independiente
  worldSize: { w: 1900, h: 1000 },

  platforms: [
    // ── Ruta derecha (más ancha, más visibles, más enemigos) ──────────────
    { x: 0.72, y: 0.76, width: 130 }, // escalón 1 derecha
    { x: 0.85, y: 0.62, width: 110 }, // escalón 2 derecha
    { x: 0.70, y: 0.49, width: 100 }, // escalón 3 derecha
    { x: 0.82, y: 0.36, width:  90 }, // escalón 4 derecha
    { x: 0.68, y: 0.24, width:  85 }, // conexión a la plataforma final

    // ── Ruta izquierda (angosta, más arriesgada visualmente, menos enemigos) ──
    { x: 0.18, y: 0.72, width:  85 }, // escalón 1 izquierda
    { x: 0.08, y: 0.57, width:  75 }, // escalón 2 izquierda (pared izquierda)
    { x: 0.25, y: 0.43, width:  70 }, // escalón 3 izquierda
    { x: 0.12, y: 0.29, width:  75 }, // escalón 4 izquierda
    { x: 0.30, y: 0.18, width:  70 }, // conexión a la plataforma final

    // ── Plataformas intermedias que conectan ambas rutas ──────────────────
    { x: 0.46, y: 0.67, width:  80 }, // puente bajo central
    { x: 0.52, y: 0.44, width:  70 }, // puente alto central

    // ── Plataforma final (convergencia) ───────────────────────────────────
    { x: 0.50, y: 0.14, width: 100 }, // ← estrella aquí
  ],

  enemies: [
    // Ruta derecha: más enemigos, más densidad
    { type: 'slime', x: 0.72, y: 0.70 },
    { type: 'slime', x: 0.85, y: 0.56 },
    { type: 'bat',   x: 0.78, y: 0.44 },
    { type: 'slime', x: 0.82, y: 0.30 },
    { type: 'bat',   x: 0.70, y: 0.18 },

    // Ruta izquierda: menos pero más sorpresivos (espacios angostos)
    { type: 'slime', x: 0.18, y: 0.66 },
    { type: 'bat',   x: 0.12, y: 0.42 },
    { type: 'slime', x: 0.28, y: 0.12 },

    // Zona central: bats que dificultan el cruce entre rutas
    { type: 'bat', x: 0.46, y: 0.55 },
    { type: 'bat', x: 0.52, y: 0.35 },

    // Guardianes de la plataforma final
    { type: 'bat',   x: 0.40, y: 0.20 },
    { type: 'bat',   x: 0.60, y: 0.20 },
    { type: 'slime', x: 0.50, y: 0.08 },
  ],
};

export default Lv7;