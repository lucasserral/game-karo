import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Pilar de Piedra con Gema Mágica
 */
export class PillarTile extends BaseTile {
  public readonly id = 'pillar';
  public readonly name = 'Pilar con Gema';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    this.pixel(ctx, ox, oy, 0, 0, '#2b2a3a', this.size, this.size);
    this.pixel(ctx, ox, oy, 4, 2, '#64748b', 24, 28);
    this.pixel(ctx, ox, oy, 6, 4, '#94a3b8', 20, 6);
    this.pixel(ctx, ox, oy, 8, 10, '#475569', 16, 14);
    this.pixel(ctx, ox, oy, 6, 24, '#334155', 20, 6);
    this.pixel(ctx, ox, oy, 12, 14, '#38bdf8', 8, 6); // Gema azul brillante
  }
}
