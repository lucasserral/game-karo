import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Sendero de Adoquines de Jardín (Estate Garden Cobblestone)
 * Reproduce las losas de piedra natural redondeadas con césped/musgo en las juntas.
 */
export class EstateStonePathTile extends BaseTile {
  public readonly id = 'estate_stone_path';
  public readonly name = 'Sendero de Piedra y Césped';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo de césped / tierra entre piedras
    this.pixel(ctx, ox, oy, 0, 0, '#86a864', this.size, this.size);

    // Mota de césped más claro
    this.pixel(ctx, ox, oy, 1, 2, '#9bc075', 2, 2);
    this.pixel(ctx, ox, oy, 29, 28, '#9bc075', 2, 2);

    // Definición de piedras de río / losas curvas
    const stones = [
      { x: 2, y: 2, w: 12, h: 12, c: '#e4decb', shadow: '#aba28f' },
      { x: 16, y: 3, w: 14, h: 10, c: '#ded7c3', shadow: '#a39b88' },
      { x: 3, y: 16, w: 13, h: 13, c: '#d5cdb8', shadow: '#99917f' },
      { x: 18, y: 15, w: 12, h: 14, c: '#ded7c3', shadow: '#a39b88' },
    ];

    for (const s of stones) {
      // Sombra exterior
      this.pixel(ctx, ox, oy, s.x - 1, s.y, '#5a6b47', s.w + 2, s.h + 2);

      // Cuerpo de la piedra
      this.pixel(ctx, ox, oy, s.x, s.y, s.c, s.w, s.h);

      // Sombra inferior y derecha de la piedra
      this.pixel(ctx, ox, oy, s.x, s.y + s.h - 2, s.shadow, s.w, 2);
      this.pixel(ctx, ox, oy, s.x + s.w - 2, s.y, s.shadow, 2, s.h);

      // Brillo superior izquierdo
      this.pixel(ctx, ox, oy, s.x + 1, s.y + 1, '#f5efe0', s.w - 3, 2);
      this.pixel(ctx, ox, oy, s.x + 1, s.y + 1, '#f5efe0', 2, s.h - 3);

      // Mota de textura en piedra
      this.pixel(ctx, ox, oy, s.x + 4, s.y + 4, '#c8c0ab', 2, 2);
    }
  }
}
