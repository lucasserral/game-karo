import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Llave Dorada Brillante (Item Interactivo)
 */
export class KeyTile extends BaseTile {
  public readonly id = 'key';
  public readonly name = 'Llave Dorada';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo transparente (no se pinta fondo sólido)

    // Anillo / Cabeza de la llave
    this.pixel(ctx, ox, oy, 11, 6, '#facc15', 10, 10);
    this.pixel(ctx, ox, oy, 13, 8, '#2b2a3a', 6, 6);

    // Eje de la llave
    this.pixel(ctx, ox, oy, 15, 16, '#facc15', 3, 10);

    // Dientes de la llave
    this.pixel(ctx, ox, oy, 18, 20, '#facc15', 4, 2);
    this.pixel(ctx, ox, oy, 18, 24, '#facc15', 3, 2);

    // Brillos y destellos
    this.pixel(ctx, ox, oy, 12, 7, '#fef08a', 2, 2);
    this.pixel(ctx, ox, oy, 15, 17, '#fef08a', 1, 6);
  }
}
