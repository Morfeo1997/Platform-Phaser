// ─── Tipos compartidos por todos los archivos de nivel ────────────────────
// Importá desde acá en cada Lv*.ts y en GameScene.

export interface PlatformDef {
  /** Fracción del ancho (0.0–1.0) o px si absolute=true */
  x:         number;
  /** Fracción del alto (0.0–1.0) o px si absolute=true */
  y:         number;
  absolute?: boolean;
  /** Ancho en px (default: 140) */
  width?:    number;
}

export type EnemyType = 'slime' | 'bat';

export interface EnemySpawn {
  type: EnemyType;
  /** Fracción del ancho (0.0–1.0) */
  x:    number;
  /** Fracción del alto (0.0–1.0) */
  y:    number;
}

/** Efectos de fondo disponibles. Cada nivel elige uno. */
export type BackgroundEffect = 'stars' | 'lava' | 'none';

export interface LevelData {
  id:           number;
  name:         string;
  /** Degradado de fondo [top-left, top-right, bottom-left, bottom-right] */
  bgColors:     [number, number, number, number];
  platformTop:  number;
  platformBody: number;
  groundTop:    number;
  groundBody:   number;
  /** Efecto animado de fondo — la escena lo ejecuta sin ifs hardcodeados */
  backgroundEffect: BackgroundEffect;
  platforms:    PlatformDef[];
  enemies:      EnemySpawn[];
  playerSpawn:  { x: number; y: number };
  /** Posición de la estrella de victoria (fracción del ancho/alto) */
  goalPosition: { x: number; y: number };
  /** ID del siguiente nivel (undefined = último nivel) */
  nextLevel?:   number;
}
