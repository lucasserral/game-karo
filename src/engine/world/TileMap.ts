import type { Sprite } from '../graphics/Sprite.ts';
import type { Camera } from '../core/Camera.ts';

export interface TileMapOptions {
  columns?: number;
  rows?: number;
  tileSize?: number;
  floorSprite?: Sprite;
  backgroundImage?: CanvasImageSource;
  customWidth?: number;
  customHeight?: number;
}

/**
 * TileMap gestiona el fondo visual del mundo, ya sea mediante una cuadrícula
 * clásica de tiles repetidos o mediante un mapa ilustrado en alta definición (como map-expectation).
 */
export class TileMap {
  public readonly columns: number;
  public readonly rows: number;
  public readonly tileSize: number;
  private floorSprite?: Sprite;
  public backgroundImage: CanvasImageSource | null = null;
  private customWidth?: number;
  private customHeight?: number;

  constructor(
    columnsOrOptions: number | TileMapOptions,
    rows = 24,
    tileSize = 32,
    floorSprite?: Sprite
  ) {
    if (typeof columnsOrOptions === 'object') {
      const opts = columnsOrOptions;
      this.tileSize = opts.tileSize ?? 32;
      this.columns = opts.columns ?? Math.ceil((opts.customWidth ?? 1600) / this.tileSize);
      this.rows = opts.rows ?? Math.ceil((opts.customHeight ?? 1066) / this.tileSize);
      this.floorSprite = opts.floorSprite;
      this.backgroundImage = opts.backgroundImage ?? null;
      this.customWidth = opts.customWidth;
      this.customHeight = opts.customHeight;
    } else {
      this.columns = columnsOrOptions;
      this.rows = rows;
      this.tileSize = tileSize;
      this.floorSprite = floorSprite;
    }
  }

  public get worldWidth(): number {
    return this.customWidth ?? this.columns * this.tileSize;
  }

  public get worldHeight(): number {
    return this.customHeight ?? this.rows * this.tileSize;
  }

  public setBackgroundImage(image: CanvasImageSource, width?: number, height?: number): void {
    this.backgroundImage = image;
    if (width) this.customWidth = width;
    if (height) this.customHeight = height;
  }

  /**
   * Renderiza únicamente las porciones visibles del fondo dentro del frustum de la cámara.
   */
  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const visibleBounds = camera.getVisibleBounds();

    // 1. Si existe imagen de fondo ilustrada completa (Estate Map)
    if (this.backgroundImage) {
      const sx = Math.max(0, Math.floor(visibleBounds.left));
      const sy = Math.max(0, Math.floor(visibleBounds.top));
      const sw = Math.min(this.worldWidth - sx, Math.ceil(visibleBounds.width));
      const sh = Math.min(this.worldHeight - sy, Math.ceil(visibleBounds.height));

      if (sw > 0 && sh > 0) {
        ctx.drawImage(this.backgroundImage, sx, sy, sw, sh, sx, sy, sw, sh);
      }
      return;
    }

    // 2. Renderizado clásico de cuadrícula de tiles
    if (this.floorSprite) {
      const startCol = Math.max(0, Math.floor(visibleBounds.left / this.tileSize));
      const endCol = Math.min(this.columns - 1, Math.floor(visibleBounds.right / this.tileSize));
      const startRow = Math.max(0, Math.floor(visibleBounds.top / this.tileSize));
      const endRow = Math.min(this.rows - 1, Math.floor(visibleBounds.bottom / this.tileSize));

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const x = c * this.tileSize;
          const y = r * this.tileSize;
          this.floorSprite.draw(ctx, x, y, this.tileSize, this.tileSize);
        }
      }
    }
  }
}
