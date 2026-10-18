import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Puerta Abierta con Paso Despejado
 */
export class DoorOpenTile extends BaseTile {
  public readonly id = 'doorOpen';
  public readonly name = 'Puerta Abierta';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Marco de piedra
    this.pixel(ctx, ox, oy, 0, 0, '#333745', this.size, this.size);
    // Interior oscuro del pasaje
    this.pixel(ctx, ox, oy, 4, 4, '#0f172a', 24, 28);
    this.pixel(ctx, ox, oy, 6, 6, '#1e293b', 20, 26);
    // Hojas de la puerta abiertas hacia los lados
    this.pixel(ctx, ox, oy, 2, 2, '#854d0e', 3, 30);
    this.pixel(ctx, ox, oy, 27, 2, '#854d0e', 3, 30);
  }
}
