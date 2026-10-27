import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Muro de Mampostería de la Mansión (Estate Masonry Wall)
 * Reproduce los muros gruesos de piedra con viga de roble superior vistos en el plano.
 */
export class EstateWallTile extends BaseTile {
  public readonly id = 'estate_wall';
  public readonly name = 'Muro de Piedra y Roble';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo de mortero oscuro
    this.pixel(ctx, ox, oy, 0, 0, '#4a443b', this.size, this.size);

    // Viga superior de madera oscura (timber beam)
    this.pixel(ctx, ox, oy, 0, 0, '#664228', 32, 8);
    this.pixel(ctx, ox, oy, 0, 0, '#825534', 32, 2); // brillo viga
    this.pixel(ctx, ox, oy, 0, 7, '#382315', 32, 1); // sombra viga

    // Sillares de piedra caliza
    const stones = [
      // Fila 1
      { x: 1, y: 9, w: 14, h: 6, c: '#beb5a5', shadow: '#918777' },
      { x: 17, y: 9, w: 14, h: 6, c: '#c8bfb0', shadow: '#999080' },
      // Fila 2
      { x: 1, y: 16, w: 9, h: 7, c: '#b5aca0', shadow: '#8c8376' },
      { x: 12, y: 16, w: 11, h: 7, c: '#c5bcb0', shadow: '#9c9284' },
      { x: 25, y: 16, w: 6, h: 7, c: '#beb5a5', shadow: '#918777' },
      // Fila 3
      { x: 1, y: 24, w: 15, h: 7, c: '#c8bfb0', shadow: '#999080' },
      { x: 18, y: 24, w: 13, h: 7, c: '#b8af9f', shadow: '#8c8376' },
    ];

    for (const s of stones) {
      this.pixel(ctx, ox, oy, s.x, s.y, s.c, s.w, s.h);
      // Sombra inferior y lateral
      this.pixel(ctx, ox, oy, s.x, s.y + s.h - 1, s.shadow, s.w, 1);
      this.pixel(ctx, ox, oy, s.x + s.w - 1, s.y, s.shadow, 1, s.h);
      // Brillo superior
      this.pixel(ctx, ox, oy, s.x, s.y, '#e5ded2', s.w - 1, 1);
    }
  }
}
