// ─── Registry de niveles ──────────────────────────────────────────────────
// Para agregar un nivel nuevo:
//   1. Creá src/data/levels/Lv3.ts
//   2. Importalo acá y agregalo al objeto LEVELS
//   3. Actualizá nextLevel en el nivel anterior

import Lv1 from '../../getLevel()/Lv1';
import Lv2 from '../../getLevel()/Lv2';
import Lv3 from '../../getLevel()/Lv3';
import Lv4 from '../../getLevel()/Lv4';
import Lv5 from '../../getLevel()/Lv5';
import Lv6 from '../../getLevel()/Lv6';
import Lv7 from '../../getLevel()/Lv7';
import Lv8 from '../../getLevel()/Lv8';
import type { LevelData } from './LevelData';

export type { LevelData, PlatformDef, EnemySpawn, EnemyType, BackgroundEffect } from './LevelData';

const LEVELS: Record<number, LevelData> = {
  1: Lv1,
  2: Lv2,
  3: Lv3,
  4: Lv4,
  5: Lv5,
  6: Lv6,
  7: Lv7,
  8: Lv8,
};

/** Devuelve el LevelData del nivel pedido. Lanza si no existe. */
export function getLevel(id: number): LevelData {
  const data = LEVELS[id];
  if (!data) throw new Error(`Nivel ${id} no registrado en levels/index.ts`);
  return data;
}

/** Lista de IDs de niveles disponibles, en orden. */
export const LEVEL_IDS = Object.keys(LEVELS).map(Number).sort((a, b) => a - b);
