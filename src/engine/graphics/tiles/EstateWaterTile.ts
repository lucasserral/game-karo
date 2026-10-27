import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Agua de Estanque con Nenúfar y Loto (Estate Lily Pond Water)
 * Reproduce el agua turquesa serena del estanque con nenúfares y flor de loto rosa.
 */
export class EstateWaterTile extends BaseTile {
  public readonly id = 'estate_water';
  public readonly name = 'Agua de Estanque con Nenúfar';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo de agua verde azulada profunda
    this.pixel(ctx, ox, oy, 0, 0, '#5ea8a0', this.size, this.size);

    // Ondas y corrientes suaves de agua
    this.pixel(ctx, ox, oy, 0, 4, '#52978f', 32, 2);
    this.pixel(ctx, ox, oy, 4, 12, '#6eb8af', 14, 2);
    this.pixel(ctx, ox, oy, 16, 20, '#52978f', 16, 2);
    this.pixel(ctx, ox, oy, 2, 26, '#6eb8af', 18, 2);

    // Reflejo luminoso en la superficie
    this.pixel(ctx, ox, oy, 6, 13, '#9ee0d8', 8, 1);
    this.pixel(ctx, ox, oy, 20, 27, '#9ee0d8', 6, 1);

    // Hoja de nenúfar flotante (redonda con muesca)
    const lx = 9;
    const ly = 10;
    // Sombra del nenúfar en el agua
    this.pixel(ctx, ox, oy, lx - 1, ly, '#386f68', 14, 13);
    // Cuerpo verde del nenúfar
    this.pixel(ctx, ox, oy, lx, ly, '#488c3a', 12, 11);
    this.pixel(ctx, ox, oy, lx + 2, ly - 1, '#488c3a', 8, 13);
    // Borde iluminado
    this.pixel(ctx, ox, oy, lx + 1, ly + 1, '#6bb857', 10, 2);
    // Muesca del nenúfar
    this.pixel(ctx, ox, oy, lx + 8, ly + 4, '#5ea8a0', 3, 3);

    // Flor de Loto Rosa en el centro
    const fx = lx + 3;
    const fy = ly + 2;
    this.pixel(ctx, ox, oy, fx, fy + 1, '#f472b6', 5, 4);
    this.pixel(ctx, ox, oy, fx + 1, fy, '#f9a8d4', 3, 2);
    this.pixel(ctx, ox, oy, fx + 2, fy + 2, '#fde047', 2, 2); // centro dorado
  }
}
