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

export type BuiltinTileType =
  | 'floor'
  | 'wall'
  | 'wallTop'
  | 'pillar'
  | 'doorClosed'
  | 'doorOpen'
  | 'key';

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
  public static createAllStandard(size = 32): Record<BuiltinTileType, BaseTile> {
    return {
      floor: TileFactory.createTile('floor', size),
      wall: TileFactory.createTile('wall', size),
      wallTop: TileFactory.createTile('wallTop', size),
      pillar: TileFactory.createTile('pillar', size),
      doorClosed: TileFactory.createTile('doorClosed', size),
      doorOpen: TileFactory.createTile('doorOpen', size),
      key: TileFactory.createTile('key', size),
    };
  }

  /**
   * Devuelve la lista de tipos de tiles registrados actualmente.
   */
  public static getRegisteredTypes(): string[] {
    return Array.from(TileFactory.registry.keys());
  }
}
