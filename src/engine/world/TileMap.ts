import type { Sprite } from '../graphics/Sprite.ts';
import type { Camera } from '../core/Camera.ts';

/**
 * TileMap manages the static background grid (floor tiles) for the world.
 */
export class TileMap {
  public readonly columns: number;
  public readonly rows: number;
  public readonly tileSize: number;
  private floorSprite: Sprite;

  constructor(columns: number, rows: number, tileSize: number, floorSprite: Sprite) {
    this.columns = columns;
    this.rows = rows;
    this.tileSize = tileSize;
    this.floorSprite = floorSprite;
  }

  public get worldWidth(): number {
    return this.columns * this.tileSize;
  }

  public get worldHeight(): number {
    return this.rows * this.tileSize;
  }

  /**
   * Renders only the visible tiles within the camera viewport for maximum efficiency.
   */
  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const visibleBounds = camera.getVisibleBounds();

    const startCol = Math.max(0, Math.floor(visibleBounds.left / this.tileSize));
    const endCol = Math.min(this.columns - 1, Math.floor(visibleBounds.right / this.tileSize));
    const startRow = Math.max(0, Math.floor(visibleBounds.top / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.floor(visibleBounds.bottom / this.tileSize));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const x = c * this.tileSize;
        const y = r * this.tileSize;
        this.floorSprite.draw(ctx, x, y, this.tileSize, this.tileSize);
      }
    }
  }
}
