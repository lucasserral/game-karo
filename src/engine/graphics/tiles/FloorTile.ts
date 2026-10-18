import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Suelo de Mazmorra (Dungeon Cobblestone)
 */
export class FloorTile extends BaseTile {
  public readonly id = 'floor';
  public readonly name = 'Suelo de Mazmorra';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo base de piedra oscura
    this.pixel(ctx, ox, oy, 0, 0, '#2b2a3a', this.size, this.size);

    // Contorno y textura de ladrillos
    ctx.strokeStyle = '#1d1c29';
    ctx.lineWidth = 1;

    // Patrón de adoquines
    ctx.strokeRect(ox + 1, oy + 1, 14, 9);
    ctx.strokeRect(ox + 17, oy + 1, 14, 9);
    ctx.strokeRect(ox + 1, oy + 11, 20, 9);
    ctx.strokeRect(ox + 22, oy + 11, 9, 9);
    ctx.strokeRect(ox + 1, oy + 21, 14, 10);
    ctx.strokeRect(ox + 17, oy + 21, 14, 10);

    // Brillos y motas de textura
    this.pixel(ctx, ox, oy, 3, 3, '#3d3c52', 2, 2);
    this.pixel(ctx, ox, oy, 19, 4, '#3d3c52', 2, 1);
    this.pixel(ctx, ox, oy, 5, 14, '#38374a', 3, 2);
    this.pixel(ctx, ox, oy, 20, 24, '#38374a', 2, 2);
  }
}
