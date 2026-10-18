import { BaseTile } from './BaseTile.ts';

/**
 * Tile personalizado definido a partir de una matriz de colores o datos de píxeles.
 * Permite integrar directamente los diseños realizados en Tile Studio dentro de la jerarquía OOP.
 */
export class CustomTile extends BaseTile {
  public readonly id: string;
  public readonly name: string;
  private pixelMatrix: string[][];

  constructor(
    pixelMatrix: string[][],
    id = 'custom',
    name = 'Tile Personalizado',
    size = 32
  ) {
    super(size);
    this.id = id;
    this.name = name;
    this.pixelMatrix = pixelMatrix;
  }

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    const rows = this.pixelMatrix.length;
    for (let y = 0; y < rows; y++) {
      const row = this.pixelMatrix[y];
      const cols = row.length;
      let x = 0;
      while (x < cols) {
        const color = row[x];
        if (!color) {
          x++;
          continue;
        }

        // Agrupación horizontal para mayor velocidad de render
        let runLen = 1;
        while (x + runLen < cols && row[x + runLen] === color) {
          runLen++;
        }

        this.pixel(ctx, ox, oy, x, y, color, runLen, 1);
        x += runLen;
      }
    }
  }

  /**
   * Actualiza la matriz de píxeles interna.
   */
  public setPixels(newMatrix: string[][]): void {
    this.pixelMatrix = newMatrix;
  }
}
