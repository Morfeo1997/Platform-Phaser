// ─── Tipos ────────────────────────────────────────────────────────────────

export interface PlatformDef {
  /** Posición X del centro (relativa al ancho: 0.0–1.0 o px fija con `absolute: true`) */
  x:          number;
  /** Posición Y del centro (relativa al alto: 0.0–1.0 o px fija con `absolute: true`) */
  y:          number;
  /** Si true, x e y son píxeles absolutos en vez de fracciones */
  absolute?:  boolean;
  /** Ancho en px (default: 140) */
  width?:     number;
}

export type EnemyType = 'slime' | 'bat';

export interface EnemySpawn {
  type:  EnemyType;
  /** Fracción del ancho (0.0–1.0) */
  x:     number;
  /** Fracción del alto (0.0–1.0) */
  y:     number;
}

export interface LevelData {
  id:          number;
  name:        string;
  /** Colores del degradado de fondo [top-left, top-right, bottom-left, bottom-right] */
  bgColors:    [number, number, number, number];
  /** Color del borde superior de plataformas */
  platformTop: number;
  /** Color del cuerpo de plataformas */
  platformBody: number;
  /** Color del borde superior del suelo */
  groundTop:   number;
  /** Color del cuerpo del suelo */
  groundBody:  number;
  platforms:   PlatformDef[];
  enemies:     EnemySpawn[];
  /** Posición de spawn del jugador (fracción del ancho/alto) */
  playerSpawn: { x: number; y: number };
}

// ─── Definición de niveles ────────────────────────────────────────────────

export const LEVELS: Record<number, LevelData> = {

  // ── Nivel 1: Las Alturas ─────────────────────────────────────────────────
  1: {
    id:           1,
    name:         'Las Alturas',
    bgColors:     [0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460],
    platformTop:  0x4ecdc4,
    platformBody: 0x2d6a4f,
    groundTop:    0x4ecdc4,
    groundBody:   0x1a5c3a,
    playerSpawn:  { x: 0.5, y: 0.85 },
    platforms: [
      { x: 0.19, y: 0.68, width: 200 },
      { x: 0.50, y: 0.48, width: 220 },
      { x: 0.81, y: 0.60, width: 200 },
      { x: 0.37, y: 0.26, width: 180 },
      { x: 0.75, y: 0.20, width: 150 },
    ],
    enemies: [],
  },

  // ── Nivel 2: Zona Volcánica ───────────────────────────────────────────────
  2: {
    id:           2,
    name:         'Zona Volcánica',
    bgColors:     [0x1a0a00, 0x2d0e00, 0x3d1200, 0x1a0500],
    platformTop:  0xff6b35,
    platformBody: 0x6b2800,
    groundTop:    0xff4500,
    groundBody:   0x3d1200,
    playerSpawn:  { x: 0.12, y: 0.85 },
    platforms: [
      // Plataformas más angostas y verticalmente dispersas → exigen doble salto
      { x: 0.25, y: 0.76, width: 120 },
      { x: 0.50, y: 0.62, width: 100 },
      { x: 0.72, y: 0.50, width: 120 },
      { x: 0.38, y: 0.38, width: 100 },
      { x: 0.62, y: 0.26, width: 110 },
      { x: 0.18, y: 0.46, width: 100 },  // plataforma lateral — atajos
      { x: 0.88, y: 0.70, width: 100 },
    ],
    enemies: [
      { type: 'slime', x: 0.25, y: 0.70 },
      { type: 'slime', x: 0.72, y: 0.44 },
      { type: 'bat',   x: 0.50, y: 0.35 },
      { type: 'bat',   x: 0.80, y: 0.20 },
      { type: 'slime', x: 0.62, y: 0.20 },
    ],
  },
};

/** Devuelve el LevelData o lanza si el nivel no existe */
export function getLevel(id: number): LevelData {
  const data = LEVELS[id];
  if (!data) throw new Error(`Nivel ${id} no definido en levels.ts`);
  return data;
}
