import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Pared Sólida de Fortaleza (Solid Fortress Stone Block)
 */
export class WallTile extends BaseTile {
  public readonly id = 'wall';
  public readonly name = 'Pared de Fortaleza';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo base de roca
    this.pixel(ctx, ox, oy, 0, 0, '#4a4f5f', this.size, this.size);

    // Sombras y biseles
    this.pixel(ctx, ox, oy, 0, 0, '#686f85', this.size, 4); // bisel superior claro
    this.pixel(ctx, ox, oy, 0, 28, '#262833', this.size, 4); // sombra inferior oscura

    // Líneas de argamasa
    ctx.fillStyle = '#2d303b';
    ctx.fillRect(ox, oy + 10, this.size, 2);
    ctx.fillRect(ox, oy + 20, this.size, 2);
    ctx.fillRect(ox + 15, oy, 2, 10);
    ctx.fillRect(ox + 7, oy + 12, 2, 8);
    ctx.fillRect(ox + 23, oy + 12, 2, 8);
    ctx.fillRect(ox + 15, oy + 22, 2, 8);

    // Fisuras y detalles
    this.pixel(ctx, ox, oy, 4, 4, '#7a829c', 2, 2);
    this.pixel(ctx, ox, oy, 20, 14, '#373a47', 3, 2);
  }
}
