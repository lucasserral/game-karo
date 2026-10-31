import { AssetManager } from '../graphics/AssetManager.ts';
import { TileMap } from './TileMap.ts';
import { World } from './World.ts';
import { Player } from '../entities/Player.ts';
import { StaticObstacle } from '../entities/StaticObstacle.ts';
import { Door } from '../entities/Door.ts';
import { KeyItem } from '../entities/KeyItem.ts';
import { WaterFountain } from '../entities/WaterFountain.ts';
import { Fireplace } from '../entities/Fireplace.ts';
import { BookshelfEntity } from '../entities/BookshelfEntity.ts';
import { KitchenStove } from '../entities/KitchenStove.ts';
import { BedEntity } from '../entities/BedEntity.ts';
import { PicnicTable } from '../entities/PicnicTable.ts';
import { GardenBench } from '../entities/GardenBench.ts';
import { BeachShore } from '../entities/BeachShore.ts';
import { TreasureChest } from '../entities/TreasureChest.ts';
import { NatureParticleSystem } from '../entities/NatureParticleSystem.ts';
import { PhotoTable } from '../entities/PhotoTable.ts';
import { PhotoFragmentItem } from '../entities/PhotoFragmentItem.ts';
import { FishingRodEntity } from '../entities/FishingRodEntity.ts';
import { QuizPaperEntity } from '../entities/QuizPaperEntity.ts';
import { MemoryBoardEntity } from '../entities/MemoryBoardEntity.ts';
import { SimonPlatesEntity } from '../entities/SimonPlatesEntity.ts';
import { WelcomeSignEntity } from '../entities/WelcomeSignEntity.ts';
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
    const playerStartX = 380;
    const playerStartY = 955;
    const player = new Player(playerStartX, playerStartY, inputManager);
    player.facingDirection = 'up';

    const world = new World(tileMap, player);

    // Cartel y nota interactiva en la entrada (al lado del jugador)
    const welcomeSign = new WelcomeSignEntity(340, 945, 36, 38);
    world.addEntity(welcomeSign);

    // 3. Asignar la Máscara de Colisión de píxel perfecto adaptada a la resolución
    world.collisionMask = assets.createCollisionMask(mapWidth, mapHeight);

    // 4. Objetos interactivos vivos y animados
    // Fuente central monumental de agua
    const fountain = new WaterFountain(636, 493, 84, 86); world.addEntity(fountain);

    // Chimeneas acogedoras con llamas vivas y partículas de ascuas
    const fire1 = new Fireplace(383, 58, 60, 33); world.addEntity(fire1);
    const fire2 = new Fireplace(564, 730, 34, 50); world.addEntity(fire2);

    // Puente de madera arqueado sobre el estanque (con barandilla frontal en primer plano)
    // world.addEntity(new Footbridge(1225, 300, 135, 75));

    // Fogón de cocina con olla humeante
    const stove = new KitchenStove(640, 45, 40, 26); world.addEntity(stove);

    // Camas en las suites
    const bed1 = new BedEntity(68, 134, 57, 56, 'Cama con Dosel'); world.addEntity(bed1);
    const bed2 = new BedEntity(863, 756, 74, 73, 'Cama de Invitawddos'); world.addEntity(bed2);
    // Mesa de banquete al aire libre
    const table = new PicnicTable(1140, 640, 64, 59); world.addEntity(table);

    // Bancos de jardín blancos para descansar
    const bench2 = new GardenBench(1142, 571, 49, 16); world.addEntity(bench2);
    world.addEntity(new GardenBench(723, 730, 16, 45));
    const bench4 = new GardenBench(494, 899, 50, 19); world.addEntity(bench4);

    // Librerías interactivas con historia y secretos
    const shelf1 = new BookshelfEntity(808, 211, 52, 32, 'Herbolario y Botánica de Karo', 'Describe las propiedades curativas de las orquídeas del invernadero y nenúfares del lago.'); world.addEntity(shelf1);

    const shelf2 = new BookshelfEntity(946, 242, 46, 16, 'Tratado de Arquitectura Clásica', 'Planos de la finca: "La llave de hierro descansa en la mesa de corte de la cocina gourmet".'); world.addEntity(shelf2);

    const shelf3 = new BookshelfEntity(497, 223, 77, 24, 'Crónicas de la Gran Dinastía', '"Solo quienes piden deseos a la fuente obtienen la fortuna y la bendición de los vientos".'); world.addEntity(shelf3);

    const shelf4 = new BookshelfEntity(210, 835, 123, 25, 'Antología de Leyendas Marítimas', 'Narra el mito del cofre sagrado oculto en las ruinas del jardín secreto septentrional.'); world.addEntity(shelf4);

    // Cofre del Tesoro en el jardín secreto del norte
    const chest1 = new TreasureChest(528, 488, 'iron_key', 36, 30); world.addEntity(chest1);

    // Llaves coleccionables dispersas en la finca
    // 1. Llave Dorada en el escritorio del estudio
    const goldenkey = new KeyItem(839, 557, assets.keySprite, 'golden_key', 'Llave Dorada', 28, 28); world.addEntity(goldenkey);

    // 2. Llave de Hierro en la tabla de la cocina
    const ironkey = new KeyItem(920, 316, assets.keySprite, 'iron_key', 'Llave de Hierro', 28, 28); world.addEntity(ironkey);

    // 3. Llave de Cristal en la orilla del estanque
    const crystalkey = new KeyItem(224, 55, assets.keySprite, 'crystal_key', 'Llave de Cristal', 28, 28); world.addEntity(crystalkey);

    // Puertas y verjas con cerrojo
    // Puertas de la Mansión (se abren con la Llave Marina key_2 pescada en el lago)
    const door = new Door(609, 610, null, null, 'key_2', 50, 18, 'Puertas de la Mansión'); world.addEntity(door);

    const door2 = new Door(870, 390, null, null, 'iron_key', 50, 18, 'Puertas traseras'); world.addEntity(door2);

    // Minijuego 1: Mesa con nota y rompecabezas de foto en (240, 740)
    const photoTable = new PhotoTable(240, 740, 25, 36)
    world.addEntity(photoTable);

    // 4 Pedacitos de fotos repartidos por el mapa
    // 1. Fragmento 1: Biblioteca/Estudio norte
    world.addEntity(new PhotoFragmentItem(920, 250, 1));
    // 2. Fragmento 2: Patio de la fuente central
    world.addEntity(new PhotoFragmentItem(904, 600, 2));
    // 3. Fragmento 3: Suite con dosel occidental
    world.addEntity(new PhotoFragmentItem(105, 150, 3));
    // 4. Fragmento 4: Costa y arena oriental
    world.addEntity(new PhotoFragmentItem(125, 405, 4));

    // Minijuego 2: Caña de pescar en el muelle en (1272, 343)
    const fishingRod = new FishingRodEntity(1272, 343, 32, 32);
    world.addEntity(fishingRod);

    // Minijuego 3: Papel con formulario de preguntas en la mesa en (415, 145)
    const quizPaper = new QuizPaperEntity(415, 145, 38, 28);
    world.addEntity(quizPaper);

    // Minijuego 4: Tablero con cartas de memoria en (970, 370)
    const memoryBoard = new MemoryBoardEntity(970, 370, 44, 34);
    world.addEntity(memoryBoard);

    // Minijuego 5: Secuencia de platos de colores en (80, 400)
    const simonPlates = new SimonPlatesEntity(99, 600, 44, 34);
    world.addEntity(simonPlates);

    // Puerta del Invernadero de Cristal (requiere Llave de Cristal)
    world.addEntity(
      new Door(
        373,
        865,
        null,
        null,
        'key_5',
        48,
        18,
        'Puerta principal'
      )
    );

    world.addEntity(
      new Door(
        91,
        720,
        null,
        null,
        'key_2',
        48,
        18,
        'Puerta de la cocina exterior'
      )
    );

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
    const beachShore = new BeachShore(1454, 753, 77, 270); world.addEntity(beachShore);

    // Troncos de árboles centenarios con colisión física en la base
    // world.addEntity(new TreeEntity(1040, 75, 30, 24));
    // world.addEntity(new TreeEntity(1105, 460, 30, 24));
    // world.addEntity(new TreeEntity(1335, 550, 30, 24));
    // world.addEntity(new TreeEntity(1440, 795, 30, 24));
    // world.addEntity(new TreeEntity(1225, 920, 30, 24));

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
