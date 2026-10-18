import { Sprite } from '../Sprite.ts';

/**
 * Clase base abstracta para todos los tiles del motor de juego.
 * Proporciona métodos comunes de dibujo de píxeles, generación de canvas y creación de Sprites.
 */
export abstract class BaseTile {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public readonly size: number;

  constructor(size = 32) {
    this.size = size;
  }

  /**
   * Dibuja el tile sobre un contexto 2D en las coordenadas de origen (ox, oy).
   */
  public abstract draw(ctx: CanvasRenderingContext2D, ox: number, oy: number): void;

  /**
   * Helper protegido para dibujar bloques de píxeles con coordenadas relativas.
   */
  protected pixel(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    x: number,
    y: number,
    color: string,
    w = 1,
    h = 1
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x, oy + y, w, h);
  }

  /**
   * Renderiza el tile en un canvas offscreen independiente de tamaño exacto.
   */
  public renderToCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.size;
    canvas.height = this.size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    this.draw(ctx, 0, 0);
    return canvas;
  }

  /**
   * Crea un Sprite a partir del tile renderizado.
   */
  public toSprite(): Sprite {
    const canvas = this.renderToCanvas();
    return new Sprite(canvas, 0, 0, this.size, this.size);
  }
}
