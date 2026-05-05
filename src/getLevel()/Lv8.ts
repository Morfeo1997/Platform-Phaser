import type { LevelData } from './LevelData';

// ─── Nivel 8: El Santuario ────────────────────────────────────────────────
// El nivel final del juego. Layout en espiral: las plataformas descienden
// en arco desde los extremos hacia el centro donde está la estrella.
// El jugador empieza abajo a la izquierda y debe "orbitar" el centro
// escalando ambos lados antes de poder alcanzar la plataforma central.
//
// Máxima densidad de enemigos del juego — 16 en total.
// Paleta: blanco luminoso / cyan eléctrico. Contraste total con niveles anteriores.
// Es la primera vez que el fondo usa 'stars' de vuelta, pero con colores distintos
// para que se lea como "sagrado" en lugar de "inicial".

const Lv8: LevelData = {
  id:   8,
  name: 'El Santuario',

  // Blanco/cyan muy luminoso — máximo contraste con el Lv7 oscuro
  bgColors:     [0x001a1a, 0x002222, 0x001515, 0x000d0d],
  platformTop:  0xeefcfc,
  platformBody: 0x2ab8b8,
  groundTop:    0xeefcfc,
  groundBody:   0x178888,

  backgroundEffect: 'stars',

  playerSpawn: { x: 0.05, y: 0.85 },

  // Estrella en el centro exacto de la pantalla, levemente arriba
  goalPosition: { x: 0.50, y: 0.12 },

  nextLevel: undefined, // fin del juego

  platforms: [
    // ── Arco izquierdo (sube desde el suelo hacia el centro) ──────────────
    { x: 0.13, y: 0.74, width:  80 }, // L1 — base izquierda
    { x: 0.07, y: 0.61, width:  70 }, // L2 — pegado a la pared
    { x: 0.18, y: 0.49, width:  75 }, // L3
    { x: 0.09, y: 0.37, width:  70 }, // L4 — pared izq alta
    { x: 0.22, y: 0.26, width:  75 }, // L5 — se aleja de la pared
    { x: 0.34, y: 0.18, width:  70 }, // L6 — aproximación al centro

    // ── Arco derecho (espejo, sube desde la derecha hacia el centro) ───────
    { x: 0.87, y: 0.74, width:  80 }, // R1 — base derecha
    { x: 0.93, y: 0.61, width:  70 }, // R2 — pegado a la pared
    { x: 0.82, y: 0.49, width:  75 }, // R3
    { x: 0.91, y: 0.37, width:  70 }, // R4 — pared der alta
    { x: 0.78, y: 0.26, width:  75 }, // R5
    { x: 0.66, y: 0.18, width:  70 }, // R6 — aproximación al centro

    // ── Plataformas centrales bajas (zona de entrada al santuario) ─────────
    { x: 0.40, y: 0.68, width:  70 }, // puente bajo izq-centro
    { x: 0.60, y: 0.68, width:  70 }, // puente bajo der-centro
    { x: 0.50, y: 0.56, width:  80 }, // plataforma central media

    // ── Plataforma del altar — la estrella ────────────────────────────────
    { x: 0.50, y: 0.15, width: 100 }, // ← estrella aquí (altar del santuario)
  ],

  enemies: [
    // ── Arco izquierdo ────────────────────────────────────────────────────
    { type: 'slime', x: 0.13, y: 0.68 }, // L1
    { type: 'bat',   x: 0.10, y: 0.53 }, // L2/L3 aéreo
    { type: 'slime', x: 0.18, y: 0.43 }, // L3
    { type: 'bat',   x: 0.16, y: 0.30 }, // L4/L5 aéreo
    { type: 'slime', x: 0.34, y: 0.12 }, // L6

    // ── Arco derecho ──────────────────────────────────────────────────────
    { type: 'slime', x: 0.87, y: 0.68 }, // R1
    { type: 'bat',   x: 0.90, y: 0.53 }, // R2/R3 aéreo
    { type: 'slime', x: 0.82, y: 0.43 }, // R3
    { type: 'bat',   x: 0.84, y: 0.30 }, // R4/R5 aéreo
    { type: 'slime', x: 0.66, y: 0.12 }, // R6

    // ── Zona central (la más peligrosa — convergencia de ambas rutas) ─────
    { type: 'bat',   x: 0.40, y: 0.60 }, // sobre puente izq
    { type: 'bat',   x: 0.60, y: 0.60 }, // sobre puente der
    { type: 'slime', x: 0.50, y: 0.50 }, // plataforma central media
    { type: 'bat',   x: 0.35, y: 0.42 }, // cruce izq→centro alto
    { type: 'bat',   x: 0.65, y: 0.42 }, // cruce der→centro alto

    // ── Guardianes del altar (3 bats en formación triangular) ─────────────
    { type: 'bat', x: 0.50, y: 0.28 }, // apex del triángulo
    { type: 'bat', x: 0.40, y: 0.20 }, // base izquierda
    { type: 'bat', x: 0.60, y: 0.20 }, // base derecha
  ],
};

export default Lv8;
