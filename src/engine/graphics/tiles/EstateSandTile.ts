import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Arena de Playa Costera (Estate Coast Sand)
 * Reproduce la arena dorada suave de la orilla derecha con conchitas y guijarros.
 */
export class EstateSandTile extends BaseTile {
  public readonly id = 'estate_sand';
  public readonly name = 'Arena de Playa Costera';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo de arena dorada cálida
    this.pixel(ctx, ox, oy, 0, 0, '#edd6b1', this.size, this.size);

    // Variaciones suaves de tono de arena
    this.pixel(ctx, ox, oy, 0, 0, '#e5cca3', 16, 16);
    this.pixel(ctx, ox, oy, 16, 16, '#dfc499', 16, 16);
    this.pixel(ctx, ox, oy, 4, 18, '#edd6b1', 12, 12);

    // Ondas suaves dejadas por el viento o la marea
    this.pixel(ctx, ox, oy, 3, 6, '#dfc499', 12, 1);
    this.pixel(ctx, ox, oy, 17, 12, '#dfc499', 13, 1);
    this.pixel(ctx, ox, oy, 6, 24, '#dfc499', 16, 1);

    // Guijarros y pequeñas conchas
    this.pixel(ctx, ox, oy, 8, 8, '#b8a17d', 2, 2);
    this.pixel(ctx, ox, oy, 8, 8, '#f7ede1', 1, 1);

    this.pixel(ctx, ox, oy, 23, 19, '#b8a17d', 3, 2);
    this.pixel(ctx, ox, oy, 24, 19, '#f7ede1', 2, 1);

    this.pixel(ctx, ox, oy, 14, 27, '#a8906c', 2, 1);
  }
}
