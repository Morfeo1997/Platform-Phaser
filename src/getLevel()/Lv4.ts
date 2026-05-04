import type { LevelData } from './LevelData';

// ─── Nivel 4: Bosque Cristalino ───────────────────────────────────────────
// Plataformas en escalera doble: sube por la derecha, baja por la izquierda.
// Densidad alta de enemigos — slimes en casi cada plataforma, bats arriba.
// La estrella está al final del recorrido, en la plataforma más alta derecha.

const Lv4: LevelData = {
  id:   4,
  name: 'Bosque Cristalino',

  bgColors:     [0x001a0d, 0x002d1a, 0x00120a, 0x000d07],
  platformTop:  0x00e5cc,
  platformBody: 0x006655,
  groundTop:    0x00c9b1,
  groundBody:   0x004d3f,

  backgroundEffect: 'none',

  playerSpawn:  { x: 0.07, y: 0.85 },

  // Estrella al final de la escalera derecha, tope
  goalPosition: { x: 0.88, y: 0.10 },

  nextLevel: 5,

  // Escalera ascendente de izquierda a derecha, luego plataformas de retorno
  // más altas — el layout recompensa explorar toda la pantalla
  platforms: [
    // Escalera principal (sube de izquierda a derecha)
    { x: 0.18, y: 0.73, width: 130 }, // peldaño 1
    { x: 0.34, y: 0.60, width: 120 }, // peldaño 2
    { x: 0.52, y: 0.47, width: 110 }, // peldaño 3
    { x: 0.70, y: 0.34, width: 100 }, // peldaño 4
    { x: 0.88, y: 0.21, width:  90 }, // peldaño 5 — estrella aquí

    // Plataformas de retorno / alternativas (más altas, más angostas)
    { x: 0.10, y: 0.47, width:  80 }, // atajo izquierdo alto
    { x: 0.78, y: 0.56, width:  80 }, // plataforma de apoyo derecha
    { x: 0.40, y: 0.28, width:  80 }, // puente central alto
  ],

  enemies: [
    // Slimes en cada peldaño de la escalera
    { type: 'slime', x: 0.18, y: 0.67 },
    { type: 'slime', x: 0.34, y: 0.54 },
    { type: 'slime', x: 0.52, y: 0.41 },
    { type: 'slime', x: 0.70, y: 0.28 },

    // Bats patrullando las zonas altas
    { type: 'bat', x: 0.25, y: 0.35 },
    { type: 'bat', x: 0.60, y: 0.20 },
    { type: 'bat', x: 0.88, y: 0.30 }, // guardián de la estrella

    // Slime en el atajo izquierdo para desincentivar el shortcut fácil
    { type: 'slime', x: 0.10, y: 0.41 },
  ],
};

export default Lv4;
