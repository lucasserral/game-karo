/**
 * Represents a static sub-rectangle of an image or canvas texture.
 */
export class Sprite {
  public source: CanvasImageSource;
  public sx: number;
  public sy: number;
  public sWidth: number;
  public sHeight: number;

  constructor(source: CanvasImageSource, sx = 0, sy = 0, sWidth = 32, sHeight = 32) {
    this.source = source;
    this.sx = sx;
    this.sy = sy;
    this.sWidth = sWidth;
    this.sHeight = sHeight;
  }

  /**
   * Draws this sprite to the given 2D context at destination coordinates.
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dWidth: number = this.sWidth,
    dHeight: number = this.sHeight,
    flipX = false
  ): void {
    if (flipX) {
      ctx.save();
      ctx.translate(Math.floor(dx + dWidth), Math.floor(dy));
      ctx.scale(-1, 1);
      ctx.drawImage(this.source, this.sx, this.sy, this.sWidth, this.sHeight, 0, 0, dWidth, dHeight);
      ctx.restore();
    } else {
      ctx.drawImage(
        this.source,
        this.sx,
        this.sy,
        this.sWidth,
        this.sHeight,
        Math.floor(dx),
        Math.floor(dy),
        dWidth,
        dHeight
      );
    }
  }
}
