import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Puerta Cerrada con Cerrojo Dorado y Refuerzos de Hierro
 */
export class DoorClosedTile extends BaseTile {
  public readonly id = 'doorClosed';
  public readonly name = 'Puerta Cerrada';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Marco de piedra
    this.pixel(ctx, ox, oy, 0, 0, '#333745', this.size, this.size);
    // Paneles de madera
    this.pixel(ctx, ox, oy, 4, 2, '#854d0e', 24, 30);
    // Separación de tablones
    this.pixel(ctx, ox, oy, 11, 2, '#533108', 2, 30);
    this.pixel(ctx, ox, oy, 19, 2, '#533108', 2, 30);
    // Bandas de hierro
    this.pixel(ctx, ox, oy, 4, 7, '#64748b', 24, 3);
    this.pixel(ctx, ox, oy, 4, 22, '#64748b', 24, 3);
    // Cerrojo dorado
    this.pixel(ctx, ox, oy, 13, 14, '#facc15', 6, 6);
    this.pixel(ctx, ox, oy, 15, 15, '#000000', 2, 2);
    this.pixel(ctx, ox, oy, 15, 17, '#000000', 2, 2);
  }
}
