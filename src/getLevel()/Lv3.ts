import type { LevelData } from './LevelData';

// ─── Nivel 3: El Abismo ───────────────────────────────────────────────────
// Plataformas en zigzag con gaps amplios — el doble salto es obligatorio.
// Mayoría de bats: el peligro viene del aire, no del suelo.
// La estrella está suspendida en una plataforma aislada al centro-tope,
// con un bat guardándola.

const Lv3: LevelData = {
  id:   3,
  name: 'El Abismo',

  bgColors:     [0x0d001a, 0x1a0033, 0x110022, 0x04000d],
  platformTop:  0x9b59b6,
  platformBody: 0x4a235a,
  groundTop:    0x7d3c98,
  groundBody:   0x2c1240,

  backgroundEffect: 'none',

  playerSpawn:  { x: 0.08, y: 0.85 },

  // Estrella suspendida en plataforma aislada al tope-centro
  goalPosition: { x: 0.50, y: 0.10 },

  nextLevel: 4,

  // Layout en zigzag: izquierda-derecha alternado, gaps deliberadamente amplios
  // para forzar el doble salto en cada transición
  platforms: [
    { x: 0.18, y: 0.74, width: 110 }, // paso 1 — izquierda baja
    { x: 0.42, y: 0.62, width:  90 }, // paso 2 — centro (gap amplio)
    { x: 0.70, y: 0.70, width: 100 }, // paso 3 — derecha
    { x: 0.85, y: 0.54, width:  80 }, // paso 4 — pared derecha, angosta
    { x: 0.55, y: 0.44, width:  90 }, // paso 5 — retrocede al centro
    { x: 0.22, y: 0.33, width:  80 }, // paso 6 — izquierda alta (doble salto requerido)
    { x: 0.50, y: 0.17, width: 120 }, // paso final — estrella aquí
  ],

  enemies: [
    // Suelo: pocos slimes, el peligro real es aéreo
    { type: 'slime', x: 0.42, y: 0.57 },
    { type: 'slime', x: 0.85, y: 0.48 },

    // Bats patrullando cada zona clave
    { type: 'bat', x: 0.30, y: 0.55 }, // zona media-izquierda
    { type: 'bat', x: 0.65, y: 0.45 }, // zona media-derecha
    { type: 'bat', x: 0.20, y: 0.25 }, // zona alta izquierda
    { type: 'bat', x: 0.50, y: 0.28 }, // guardián de la estrella
  ],
};

export default Lv3;
