import { AssetManager } from '../graphics/AssetManager.ts';
import { TileMap } from './TileMap.ts';
import { World } from './World.ts';
import { Player } from '../entities/Player.ts';
import { StaticObstacle } from '../entities/StaticObstacle.ts';
import { Door } from '../entities/Door.ts';
import { KeyItem } from '../entities/KeyItem.ts';
import type { InputManager } from '../core/InputManager.ts';

/**
 * LevelBuilder constructs a playable dungeon level to showcase
 * passive collisions, active interactions, directional animations, and camera tracking.
 */
export class LevelBuilder {
  public static buildDemoWorld(inputManager: InputManager): World {
    const assets = AssetManager.getInstance();
    const tileSize = assets.tileSize; // 32px

    const cols = 30; // 960px world width
    const rows = 24; // 768px world height

    const tileMap = new TileMap(cols, rows, tileSize, assets.floorSprite);

    // Spawn player in the central entrance chamber
    const playerStartX = 5 * tileSize;
    const playerStartY = 12 * tileSize;
    const player = new Player(playerStartX, playerStartY, inputManager);

    const world = new World(tileMap, player);

    // Map Layout ASCII matrix
    // # = Wall
    // P = Pillar
    // D = Locked Door
    // K = Golden Key
    // . = Open Floor (empty)
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
          case '#': {
            // Passive impenetrable wall obstacle
            world.addEntity(new StaticObstacle(x, y, assets.wallSprite, 'wall', tileSize, tileSize));
            break;
          }
          case 'P': {
            // Passive stone pillar obstacle
            world.addEntity(new StaticObstacle(x, y, assets.pillarSprite, 'pillar', tileSize, tileSize));
            break;
          }
          case 'D': {
            // Passive + Active locked door
            const door = new Door(
              x,
              y,
              assets.doorClosedSprite,
              assets.doorOpenSprite,
              'golden_key',
              tileSize,
              tileSize
            );
            world.addEntity(door);
            break;
          }
          case 'K': {
            // Active collectible golden key
            const key = new KeyItem(
              x,
              y,
              assets.keySprite,
              'golden_key',
              'Llave Dorada',
              tileSize,
              tileSize
            );
            world.addEntity(key);
            break;
          }
        }
      }
    }

    return world;
  }
}
