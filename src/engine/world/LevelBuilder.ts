import { AssetManager } from '../graphics/AssetManager.ts';
import { TileMap } from './TileMap.ts';
import { World } from './World.ts';
import { Player } from '../entities/Player.ts';
import { StaticObstacle } from '../entities/StaticObstacle.ts';
import { Door } from '../entities/Door.ts';
import { KeyItem } from '../entities/KeyItem.ts';
import { WaterFountain } from '../entities/WaterFountain.ts';
import { Fireplace } from '../entities/Fireplace.ts';
import { Footbridge } from '../entities/Footbridge.ts';
import { BookshelfEntity } from '../entities/BookshelfEntity.ts';
import { KitchenStove } from '../entities/KitchenStove.ts';
import { BedEntity } from '../entities/BedEntity.ts';
import { PicnicTable } from '../entities/PicnicTable.ts';
import { GardenBench } from '../entities/GardenBench.ts';
import { BeachShore } from '../entities/BeachShore.ts';
import { TreasureChest } from '../entities/TreasureChest.ts';
import { NatureParticleSystem } from '../entities/NatureParticleSystem.ts';
import { TreeEntity } from '../entities/TreeEntity.ts';
import type { InputManager } from '../core/InputManager.ts';

/**
 * LevelBuilder construye niveles para el motor:
 * - buildEstateWorld: La impresionante mansión con máscara de colisión de píxel perfecto
 *   y objetos de juego interactivos vivos (map-expectation).
 * - buildDemoWorld: Nivel de mazmorra clásica retro.
 */
export class LevelBuilder {
  /**
   * Construye el mundo de la Finca y Mansión (1600x1066) utilizando la máscara
   * de colisión para las paredes y manteniendo todos los objetos interactivos.
   */
  public static buildEstateWorld(inputManager: InputManager): World {
    const assets = AssetManager.getInstance();

    const bgImg = assets.estateMapImage;
    const mapWidth = bgImg?.naturalWidth || 1600;
    const mapHeight = bgImg?.naturalHeight || 1066;

    // 1. Crear el mapa de fondo ilustrado en alta definición
    const tileMap = new TileMap({
      customWidth: mapWidth,
      customHeight: mapHeight,
      backgroundImage: bgImg ?? undefined,
      foregroundImage: assets.estateForegroundImage ?? undefined,
      floorSprite: assets.estateWoodFloorSprite,
    });

    // 2. Jugador: Inicia en el patio central, al sur de la fuente
    const playerStartX = 540;
    const playerStartY = 9a55;
    const player = new Player(playerStartX, playerStartY, inputManager);
    player.facingDirection = 'up';

    const world = new World(tileMap, player);

    // 3. Asignar la Máscara de Colisión de píxel perfecto adaptada a la resolución
    world.collisionMask = assets.createCollisionMask(mapWidth, mapHeight);

    // 4. Objetos interactivos vivos y animados
    // Fuente central monumental de agua
    world.addEntity(new WaterFountain(640, 490));

    // Chimeneas acogedoras con llamas vivas y partículas de ascuas
    world.addEntity(new Fireplace(375, 20, 60, 50)); // Salón principal norte
    world.addEntity(new Fireplace(530, 730, 55, 50)); // Salón semicircular sur

    // Puente de madera arqueado sobre el estanque (con barandilla frontal en primer plano)
    world.addEntity(new Footbridge(1225, 300, 135, 75));

    // Fogón de cocina con olla humeante
    world.addEntity(new KitchenStove(645, 22, 65, 45));

    // Camas en las suites
    world.addEntity(new BedEntity(45, 105, 80, 85, 'Cama con Dosel'));
    world.addEntity(new BedEntity(840, 720, 85, 110, 'Cama de Invitados'));

    // Mesa de banquete al aire libre
    world.addEntity(new PicnicTable(1110, 615, 85, 75));

    // Bancos de jardín blancos para descansar
    world.addEntity(new GardenBench(1055, 250, 36, 40));
    world.addEntity(new GardenBench(1120, 550, 40, 32));
    world.addEntity(new GardenBench(700, 710, 36, 45));
    world.addEntity(new GardenBench(485, 865, 45, 32));
    world.addEntity(new GardenBench(240, 950, 45, 32));

    // Librerías interactivas con historia y secretos
    world.addEntity(
      new BookshelfEntity(
        780,
        160,
        65,
        85,
        'Herbolario y Botánica de Karo',
        'Describe las propiedades curativas de las orquídeas del invernadero y nenúfares del lago.'
      )
    );
    world.addEntity(
      new BookshelfEntity(
        920,
        160,
        75,
        85,
        'Tratado de Arquitectura Clásica',
        'Planos de la finca: "La llave de hierro descansa en la mesa de corte de la cocina gourmet".'
      )
    );
    world.addEntity(
      new BookshelfEntity(
        440,
        215,
        120,
        35,
        'Crónicas de la Gran Dinastía',
        '"Solo quienes piden deseos a la fuente obtienen la fortuna y la bendición de los vientos".'
      )
    );
    world.addEntity(
      new BookshelfEntity(
        210,
        825,
        120,
        35,
        'Antología de Leyendas Marítimas',
        'Narra el mito del cofre sagrado oculto en las ruinas del jardín secreto septentrional.'
      )
    );

    // Cofre del Tesoro en el jardín secreto del norte
    world.addEntity(new TreasureChest(880, 65, 'iron_key', 36, 30));

    // Llaves coleccionables dispersas en la finca
    // 1. Llave Dorada en el escritorio del estudio
    world.addEntity(
      new KeyItem(
        875,
        215,
        assets.keySprite,
        'golden_key',
        'Llave Dorada',
        28,
        28
      )
    );
    // 2. Llave de Hierro en la tabla de la cocina
    world.addEntity(
      new KeyItem(
        695,
        155,
        assets.keySprite,
        'iron_key',
        'Llave de Hierro',
        28,
        28
      )
    );
    // 3. Llave de Cristal en la orilla del estanque
    world.addEntity(
      new KeyItem(
        1420,
        240,
        assets.keySprite,
        'crystal_key',
        'Llave de Cristal',
        28,
        28
      )
    );

    // Puertas y verjas con cerrojo
    // Puerta de la Suite Principal (requiere Llave Dorada)
    world.addEntity(
      new Door(
        200,
        175,
        null,
        null,
        'golden_key',
        18,
        42,
        'Puerta de la Suite Principal'
      )
    );
    // Verja de Hierro del Jardín Secreto (requiere Llave de Hierro)
    world.addEntity(
      new Door(
        840,
        145,
        null,
        null,
        'iron_key',
        50,
        18,
        'Verja del Jardín Secreto'
      )
    );
    // Puerta del Invernadero de Cristal (requiere Llave de Cristal)
    world.addEntity(
      new Door(
        885,
        655,
        null,
        null,
        'crystal_key',
        48,
        18,
        'Puerta del Invernadero'
      )
    );

    // Costa y oleaje del mar oriental
    world.addEntity(new BeachShore(1460, 600, 140, 466));

    // Troncos de árboles centenarios con colisión física en la base
    world.addEntity(new TreeEntity(1040, 75, 30, 24));
    world.addEntity(new TreeEntity(1105, 460, 30, 24));
    world.addEntity(new TreeEntity(1335, 550, 30, 24));
    world.addEntity(new TreeEntity(1440, 795, 30, 24));
    world.addEntity(new TreeEntity(1225, 920, 30, 24));

    // Sistema de partículas ambientales (pétalos de flores y hojas meciéndose en el viento)
    world.addEntity(new NatureParticleSystem(1600, 1066, 75));

    return world;
  }

  /**
   * Construye el nivel de mazmorra clásica retro (para demostración).
   */
  public static buildDemoWorld(inputManager: InputManager): World {
    const assets = AssetManager.getInstance();
    const tileSize = assets.tileSize; // 32px

    const cols = 30; // 960px world width
    const rows = 24; // 768px world height

    const tileMap = new TileMap(cols, rows, tileSize, assets.floorSprite);

    const playerStartX = 5 * tileSize;
    const playerStartY = 12 * tileSize;
    const player = new Player(playerStartX, playerStartY, inputManager);

    const world = new World(tileMap, player);

    const mapLayout: string[] = [
      '##############################',
      '#............#...............#',
      '#..P......P..#...P.......P...#',
      '#............#...............#',
      '#.....K......#...............#',
      '#..P......P..#...............#',
      '#............#...P.......P...#',
      '#............#...............#',
      '######..######...............#',
      '#............#################',
      '#............#...............#',
      '#............#...P.......P...#',
      '#............D...............#',
      '#............#...............#',
      '#..P......P..#...P.......P...#',
      '#............#...............#',
      '######..######...............#',
      '#............#################',
      '#............#...............#',
      '#..P......P..#.......P.......#',
      '#............#...............#',
      '#............#...P.......P...#',
      '#............#...............#',
      '##############################',
    ];

    for (let r = 0; r < rows; r++) {
      const line = mapLayout[r] || '';
      for (let c = 0; c < cols; c++) {
        const char = line[c] || '#';
        const x = c * tileSize;
        const y = r * tileSize;

        switch (char) {
          case '#':
            world.addEntity(new StaticObstacle(x, y, assets.wallSprite, 'wall', tileSize, tileSize));
            break;
          case 'P':
            world.addEntity(new StaticObstacle(x, y, assets.pillarSprite, 'pillar', tileSize, tileSize));
            break;
          case 'D':
            world.addEntity(
              new Door(x, y, assets.doorClosedSprite, assets.doorOpenSprite, 'golden_key', tileSize, tileSize)
            );
            break;
          case 'K':
            world.addEntity(
              new KeyItem(x, y, assets.keySprite, 'golden_key', 'Llave Dorada', tileSize, tileSize)
            );
            break;
        }
      }
    }

    return world;
  }
}
