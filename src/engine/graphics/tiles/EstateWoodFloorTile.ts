import { BaseTile } from './BaseTile.ts';

/**
 * Tile de Suelo de Madera de la Mansión (Estate Wood Floor)
 * Reproduce las tablas de madera cálida pulida con vetas y clavos del salón y comedor.
 */
export class EstateWoodFloorTile extends BaseTile {
  public readonly id = 'estate_wood_floor';
  public readonly name = 'Suelo de Madera de Mansión';

  public draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
    // Fondo base de madera cálida
    this.pixel(ctx, ox, oy, 0, 0, '#c49a6c', this.size, this.size);

    // Separación de tablones verticales
    const plankWidth = 8;
    for (let p = 0; p < 4; p++) {
      const px = p * plankWidth;

      // Sombra entre tablones
      this.pixel(ctx, ox, oy, px, 0, '#7c532d', 1, 32);
      // Brillo en el borde del tablón
      this.pixel(ctx, ox, oy, px + 1, 0, '#d8b082', 1, 32);

      // Vetas sutiles de madera
      this.pixel(ctx, ox, oy, px + 3, (p * 7) % 32, '#a57849', 2, 8);
      this.pixel(ctx, ox, oy, px + 5, (p * 13 + 4) % 32, '#b88c5d', 1, 12);
      this.pixel(ctx, ox, oy, px + 2, (p * 19 + 8) % 32, '#96683b', 1, 6);

      // Clavos pequeños en los extremos de los tablones
      this.pixel(ctx, ox, oy, px + 4, 3, '#5c391a', 1, 1);
      this.pixel(ctx, ox, oy, px + 4, 28, '#5c391a', 1, 1);
    }
  }
}
