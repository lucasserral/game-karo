import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Seto de Boj Recortado (Topiary Garden Hedge)
 * Reproduce el seto denso del jardín formal que rodea la fuente.
 */
export class EstateHedgeTile extends BaseTile {
  public readonly id = 'estate_hedge';
  public readonly name = 'Seto de Jardín Formal';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo de verde oscuro de sombra profunda
    this.pixel(ctx, ox, oy, 0, 0, '#2e4e22', this.size, this.size);

    // Contorno exterior sombreado
    ctx.strokeStyle = '#1b3113';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, this.size - 1, this.size - 1);

    // Relleno principal de follaje verde medio
    this.pixel(ctx, ox, oy, 2, 2, '#487c35', 28, 28);

    // Grupos de hojas con luces y sombras (textura de arbusto)
    const clusters = [
      { x: 3, y: 3, w: 7, h: 6 },
      { x: 12, y: 4, w: 9, h: 7 },
      { x: 23, y: 3, w: 6, h: 6 },
      { x: 5, y: 11, w: 8, h: 8 },
      { x: 15, y: 13, w: 8, h: 7 },
      { x: 22, y: 12, w: 7, h: 8 },
      { x: 4, y: 21, w: 8, h: 7 },
      { x: 13, y: 22, w: 9, h: 7 },
      { x: 23, y: 21, w: 6, h: 7 },
    ];

    for (const c of clusters) {
      // Sombra inferior de la hoja
      this.pixel(ctx, ox, oy, c.x, c.y + c.h - 2, '#355c26', c.w, 2);
      // Brillo superior iluminado por el sol
      this.pixel(ctx, ox, oy, c.x + 1, c.y, '#6ea74e', c.w - 2, 2);
      // Puntos de luz viva
      this.pixel(ctx, ox, oy, c.x + 2, c.y + 1, '#8bc965', 2, 1);
    }
  }
}
