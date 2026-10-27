import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Alfombra Ornamental Rosa (Estate Ornate Pink Rug)
 * Reproduce las lujosas alfombras persas en tonos rosa pastel con greca decorativa del salón y comedor.
 */
export class EstateRugTile extends BaseTile {
  public readonly id = 'estate_rug';
  public readonly name = 'Alfombra Ornamental Rosa';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo de madera visible en los bordes
    this.pixel(ctx, ox, oy, 0, 0, '#c49a6c', this.size, this.size);

    // Cuerpo principal de la alfombra (con flecos)
    this.pixel(ctx, ox, oy, 2, 2, '#fff2f2', 28, 28); // Flecos marfil
    this.pixel(ctx, ox, oy, 3, 3, '#f5c6c6', 26, 26); // Fondo rosa pastel

    // Marco exterior granate/rosa oscuro
    ctx.strokeStyle = '#b86b6b';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 4.5, oy + 4.5, 23, 23);

    // Marco interior decorativo
    ctx.strokeStyle = '#e29595';
    ctx.strokeRect(ox + 7.5, oy + 7.5, 17, 17);

    // Medallón central arabesco
    this.pixel(ctx, ox, oy, 13, 13, '#b86b6b', 6, 6);
    this.pixel(ctx, ox, oy, 14, 14, '#ffffff', 4, 4);
    this.pixel(ctx, ox, oy, 15, 15, '#c97777', 2, 2);

    // Detalles florales en las 4 esquinas
    this.pixel(ctx, ox, oy, 6, 6, '#b86b6b', 2, 2);
    this.pixel(ctx, ox, oy, 24, 6, '#b86b6b', 2, 2);
    this.pixel(ctx, ox, oy, 6, 24, '#b86b6b', 2, 2);
    this.pixel(ctx, ox, oy, 24, 24, '#b86b6b', 2, 2);
  }
}
