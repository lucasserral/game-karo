import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Techo de Pared (Wall Top Trim)
 */
export class WallTopTile extends BaseTile {
  public readonly id = 'wallTop';
  public readonly name = 'Techo de Pared';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    this.pixel(ctx, ox, oy, 0, 0, '#3a3e4c', this.size, this.size);
    this.pixel(ctx, ox, oy, 0, 0, '#52576b', this.size, 2);
    this.pixel(ctx, ox, oy, 2, 4, '#6b728c', 28, 24);
    this.pixel(ctx, ox, oy, 4, 6, '#464a5c', 24, 20);
  }
}
