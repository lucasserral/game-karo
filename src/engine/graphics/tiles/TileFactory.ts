import { BaseTile } from './BaseTile.ts';
import { FloorTile } from './FloorTile.ts';
import { WallTile } from './WallTile.ts';
import { WallTopTile } from './WallTopTile.ts';
import { PillarTile } from './PillarTile.ts';
import { DoorClosedTile } from './DoorClosedTile.ts';
import { DoorOpenTile } from './DoorOpenTile.ts';
import { KeyTile } from './KeyTile.ts';
import { CustomTile } from './CustomTile.ts';
import { TestTile } from './TestTile.ts';
import { EstateWoodFloorTile } from './EstateWoodFloorTile.ts';
import { EstateStonePathTile } from './EstateStonePathTile.ts';
import { EstateHedgeTile } from './EstateHedgeTile.ts';
import { EstateWaterTile } from './EstateWaterTile.ts';
import { EstateSandTile } from './EstateSandTile.ts';
import { EstateRugTile } from './EstateRugTile.ts';
import { EstateWallTile } from './EstateWallTile.ts';
import { EstateBookshelfTile } from './EstateBookshelfTile.ts';
import { EstateFountainTile } from './EstateFountainTile.ts';

export type BuiltinTileType =
  | 'floor'
  | 'wall'
  | 'wallTop'
  | 'pillar'
  | 'doorClosed'
  | 'doorOpen'
  | 'key'
  | 'estate_wood_floor'
  | 'estate_stone_path'
  | 'estate_hedge'
  | 'estate_water'
  | 'estate_sand'
  | 'estate_rug'
  | 'estate_wall'
  | 'estate_bookshelf'
  | 'estate_fountain';

export type TileType = BuiltinTileType | 'custom' | string;

export type TileConstructor = new (size?: number) => BaseTile;

/**
 * Patrón de diseño Factory para la creación y gestión desacoplada de tiles.
 * Permite instanciar tiles concretos a partir de un identificador de tipo,
 * facilitando la extensibilidad sin modificar el código de los consumidores.
 */
export class TileFactory {
  private static registry: Map<string, TileConstructor> = new Map();

  // Registro inicial de los tiles del motor
  static {
    TileFactory.registerTile('floor', FloorTile);
    TileFactory.registerTile('wall', WallTile);
    TileFactory.registerTile('wallTop', WallTopTile);
    TileFactory.registerTile('pillar', PillarTile);
    TileFactory.registerTile('doorClosed', DoorClosedTile);
    TileFactory.registerTile('doorOpen', DoorOpenTile);
    TileFactory.registerTile('key', KeyTile);
    TileFactory.registerTile('test', TestTile);

    // Tiles específicos de la Mansión y Jardines (map-expectation)
    TileFactory.registerTile('estate_wood_floor', EstateWoodFloorTile);
    TileFactory.registerTile('estate_stone_path', EstateStonePathTile);
    TileFactory.registerTile('estate_hedge', EstateHedgeTile);
    TileFactory.registerTile('estate_water', EstateWaterTile);
    TileFactory.registerTile('estate_sand', EstateSandTile);
    TileFactory.registerTile('estate_rug', EstateRugTile);
    TileFactory.registerTile('estate_wall', EstateWallTile);
    TileFactory.registerTile('estate_bookshelf', EstateBookshelfTile);
    TileFactory.registerTile('estate_fountain', EstateFountainTile);
  }

  /**
   * Registra una nueva clase de Tile en la fábrica.
   */
  public static registerTile(type: string, tileClass: TileConstructor): void {
    TileFactory.registry.set(type.toLowerCase(), tileClass);
  }

  /**
   * Crea una instancia de tile según el tipo solicitado.
   * Si el tipo es 'custom', requiere la matriz de píxeles.
   */
  public static createTile(type: TileType, size = 32, customPixels?: string[][]): BaseTile {
    const key = type.toLowerCase();

    if (key === 'custom') {
      return new CustomTile(customPixels || [], 'custom', 'Tile Personalizado', size);
    }

    const TileClass = TileFactory.registry.get(key);
    if (!TileClass) {
      console.warn(`TileFactory: Tipo de tile desconocido "${type}". Usando FloorTile por defecto.`);
      return new FloorTile(size);
    }

    return new TileClass(size);
  }

  /**
   * Crea un mapa con todas las instancias de tiles estándar registradas.
   */
  public static createAllStandard(size = 32): Record<string, BaseTile> {
    const all: Record<string, BaseTile> = {};
    for (const [key, constructor] of TileFactory.registry.entries()) {
      all[key] = new constructor(size);
    }
    return all;
  }

  /**
   * Devuelve la lista de tipos de tiles registrados actualmente.
   */
  public static getRegisteredTypes(): string[] {
    return Array.from(TileFactory.registry.keys());
  }
}
