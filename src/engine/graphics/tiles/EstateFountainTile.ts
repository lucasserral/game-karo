import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Fuente Circular de Piedra (Estate Fountain Basin)
 * Reproduce la cuenca de piedra labrada con agua cristalina y chorro de la fuente central.
 */
export class EstateFountainTile extends BaseTile {
  public readonly id = 'estate_fountain';
  public readonly name = 'Fuente de Agua de Piedra';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo de adoquines de patio
    this.pixel(ctx, ox, oy, 0, 0, '#ded7c3', this.size, this.size);

    // Borde circular de piedra exterior
    ctx.fillStyle = '#b5ac99';
    ctx.beginPath();
    ctx.arc(ox + 16, oy + 16, 14, 0, Math.PI * 2);
    ctx.fill();

    // Borde superior iluminado de la cuenca
    ctx.fillStyle = '#f0ebe1';
    ctx.beginPath();
    ctx.arc(ox + 16, oy + 15, 12, 0, Math.PI * 2);
    ctx.fill();

    // Interior de agua turquesa cristalina
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(ox + 16, oy + 16, 10, 0, Math.PI * 2);
    ctx.fill();

    // Onda concéntrica más profunda
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(ox + 16, oy + 16, 7, 0, Math.PI * 2);
    ctx.fill();

    // Pilar / surtidor central de piedra
    this.pixel(ctx, ox, oy, 14, 14, '#e2e8f0', 4, 4);
    this.pixel(ctx, ox, oy, 15, 13, '#ffffff', 2, 2); // Salpique blanco
    this.pixel(ctx, ox, oy, 14, 16, '#94a3b8', 4, 1); // Sombra del surtidor

    // Destellos de gotas de agua
    this.pixel(ctx, ox, oy, 10, 12, '#e0f2fe', 2, 1);
    this.pixel(ctx, ox, oy, 20, 18, '#e0f2fe', 2, 1);
  }
}
