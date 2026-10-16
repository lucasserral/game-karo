import { Sprite } from './Sprite.ts';
import type { AnimationClip } from './AnimatedSprite.ts';

/**
 * Función pura que calcula las coordenadas de corte en la grilla y dibuja
 * el fotograma exacto usando ctx.drawImage.
 *
 * @param ctx Contexto 2D del Canvas
 * @param image Imagen o spritesheet cargada (HTMLImageElement o CanvasImageSource)
 * @param frameIndex Índice del fotograma actual de la animación (0, 1, 2...)
 * @param cols Cantidad de columnas (fotogramas por fila) en la grilla
 * @param frameWidth Ancho de cada fotograma en píxeles (ej: 32)
 * @param frameHeight Alto de cada fotograma en píxeles (ej: 32)
 * @param dx Posición X en el canvas donde se dibuja el sprite
 * @param dy Posición Y en el canvas donde se dibuja el sprite
 * @param dWidth Ancho de destino (opcional, por defecto frameWidth)
 * @param dHeight Alto de destino (opcional, por defecto frameHeight)
 * @param flipX Si debe voltearse horizontalmente
 */
export function drawSpriteGridFrame(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  frameIndex: number,
  cols: number,
  frameWidth: number,
  frameHeight: number,
  dx: number,
  dy: number,
  dWidth: number = frameWidth,
  dHeight: number = frameHeight,
  flipX = false
): void {
  // 1. Calcular en qué columna y fila de la grilla está el fotograma
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);

  // 2. Coordenadas de origen (sx, sy) dentro de la imagen
  const sx = col * frameWidth;
  const sy = row * frameHeight;

  // 3. Renderizado con ctx.drawImage
  if (flipX) {
    ctx.save();
    ctx.translate(Math.floor(dx + dWidth), Math.floor(dy));
    ctx.scale(-1, 1);
    ctx.drawImage(image, sx, sy, frameWidth, frameHeight, 0, 0, dWidth, dHeight);
    ctx.restore();
  } else {
    ctx.drawImage(
      image,
      sx,
      sy,
      frameWidth,
      frameHeight,
      Math.floor(dx),
      Math.floor(dy),
      dWidth,
      dHeight
    );
  }
}

/**
 * Clase orientada a objetos que encapsula una hoja de sprites (Spritesheet)
 * organizada en una grilla de fotogramas uniformes.
 */
export class SpriteSheet {
  public readonly image: HTMLImageElement | CanvasImageSource;
  public readonly frameWidth: number;
  public readonly frameHeight: number;
  public readonly cols: number;
  public readonly rows: number;

  constructor(
    image: HTMLImageElement | CanvasImageSource,
    frameWidth: number,
    frameHeight: number,
    cols?: number,
    rows?: number
  ) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    const imgWidth = (image as HTMLImageElement).naturalWidth ?? (image as HTMLCanvasElement).width ?? 0;
    const imgHeight = (image as HTMLImageElement).naturalHeight ?? (image as HTMLCanvasElement).height ?? 0;

    this.cols = cols ?? (imgWidth > 0 ? Math.floor(imgWidth / frameWidth) : 1);
    this.rows = rows ?? (imgHeight > 0 ? Math.floor(imgHeight / frameHeight) : 1);
  }

  /**
   * Carga asíncronamente una imagen desde una URL o ruta en /public/
   */
  public static async load(
    url: string,
    frameWidth: number,
    frameHeight: number,
    cols?: number,
    rows?: number
  ): Promise<SpriteSheet> {
    const img = new Image();
    img.src = url;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (err) => reject(new Error(`Error cargando imagen en ${url}: ${err}`));
    });

    return new SpriteSheet(img, frameWidth, frameHeight, cols, rows);
  }

  /**
   * Dibuja directamente un fotograma de la grilla en el canvas utilizando ctx.drawImage.
   */
  public drawFrame(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
    flipX = false
  ): void {
    drawSpriteGridFrame(
      ctx,
      this.image,
      frameIndex,
      this.cols,
      this.frameWidth,
      this.frameHeight,
      dx,
      dy,
      dWidth,
      dHeight,
      flipX
    );
  }

  /**
   * Obtiene un objeto Sprite individual a partir de coordenadas de grilla (columna, fila).
   */
  public getSprite(col: number, row: number): Sprite {
    const sx = col * this.frameWidth;
    const sy = row * this.frameHeight;
    return new Sprite(this.image, sx, sy, this.frameWidth, this.frameHeight);
  }

  /**
   * Obtiene un objeto Sprite individual a partir de un índice lineal.
   */
  public getSpriteByIndex(frameIndex: number): Sprite {
    const col = frameIndex % this.cols;
    const row = Math.floor(frameIndex / this.cols);
    return this.getSprite(col, row);
  }

  /**
   * Crea un clip de animación (AnimationClip) a partir de una fila de la grilla.
   * Ideal para animaciones del tipo: Fila 0 = Caminar Abajo, Fila 1 = Caminar Arriba, etc.
   */
  public createRowAnimation(
    name: string,
    rowIndex: number,
    frameCount: number,
    frameDuration = 0.15,
    loop = true
  ): AnimationClip {
    const frames: Sprite[] = [];
    for (let c = 0; c < frameCount; c++) {
      frames.push(this.getSprite(c, rowIndex));
    }
    return {
      name,
      frames,
      frameDuration,
      loop,
    };
  }
}
