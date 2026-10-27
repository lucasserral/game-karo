import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Estantería de Biblioteca (Estate Library Bookshelf)
 * Reproduce las bibliotecas de caoba repletas de volúmenes de colores vistas en el estudio.
 */
export class EstateBookshelfTile extends BaseTile {
  public readonly id = 'estate_bookshelf';
  public readonly name = 'Librería de Caoba con Libros';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo de madera de caoba oscura
    this.pixel(ctx, ox, oy, 0, 0, '#4e2817', this.size, this.size);

    // Laterales y baldas de la estantería
    this.pixel(ctx, ox, oy, 0, 0, '#6d3c22', 2, 32); // montante izquierdo
    this.pixel(ctx, ox, oy, 30, 0, '#361c10', 2, 32); // montante derecho sombra
    this.pixel(ctx, ox, oy, 0, 0, '#854b2a', 32, 2); // cornisa superior
    this.pixel(ctx, ox, oy, 2, 15, '#784126', 28, 2); // balda media
    this.pixel(ctx, ox, oy, 2, 30, '#592e1a', 28, 2); // balda inferior

    // Libros Estante Superior (y: 3 a 14)
    const topBooks = [
      { w: 3, c: '#b91c1c', title: '#fef08a' }, // carmesí con letras oro
      { w: 4, c: '#15803d', title: '#86efac' }, // esmeralda
      { w: 3, c: '#1d4ed8', title: '#bfdbfe' }, // zafiro
      { w: 4, c: '#b45309', title: '#fde68a' }, // cuero ámbar
      { w: 3, c: '#7e22ce', title: '#f3e8ff' }, // púrpura
      { w: 4, c: '#0f766e', title: '#99f6e4' }, // verde azulado
      { w: 4, c: '#9a3412', title: '#fed7aa' }, // terracota
    ];

    let bx = 3;
    for (const b of topBooks) {
      if (bx + b.w > 29) break;
      this.pixel(ctx, ox, oy, bx, 3, b.c, b.w, 12);
      // Letras doradas o adorno en lomo
      this.pixel(ctx, ox, oy, bx + 1, 7, b.title, b.w - 2, 2);
      // Separación oscura entre libros
      this.pixel(ctx, ox, oy, bx + b.w - 1, 3, '#2a160d', 1, 12);
      bx += b.w;
    }

    // Libros Estante Inferior (y: 18 a 29)
    const bottomBooks = [
      { w: 4, c: '#047857', title: '#a7f3d0' },
      { w: 3, c: '#be123c', title: '#fecdd3' },
      { w: 5, c: '#c2410c', title: '#ffedd5' },
      { w: 3, c: '#4338ca', title: '#c7d2fe' },
      { w: 4, c: '#854d0e', title: '#fef9c3' },
      { w: 4, c: '#0369a1', title: '#bae6fd' },
    ];

    bx = 3;
    for (const b of bottomBooks) {
      if (bx + b.w > 29) break;
      this.pixel(ctx, ox, oy, bx, 18, b.c, b.w, 12);
      this.pixel(ctx, ox, oy, bx + 1, 22, b.title, b.w - 2, 2);
      this.pixel(ctx, ox, oy, bx + b.w - 1, 18, '#2a160d', 1, 12);
      bx += b.w;
    }
  }
}
