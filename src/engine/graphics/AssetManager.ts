import { Sprite } from './Sprite.ts';
import { AnimatedSprite } from './AnimatedSprite.ts';
import { SpriteSheet } from './SpriteSheet.ts';
import { TileFactory } from './tiles/index.ts';
import { CollisionMask } from '../world/CollisionMask.ts';

/**
 * AssetManager creates and stores sprites, tiles, and animations.
 * Generates high-fidelity retro pixel-art spritesheets natively in Canvas
 * so that assets are guaranteed to load immediately, crisply, and without external dependencies.
 */
export class AssetManager {
  private static instance: AssetManager | null = null;

  public tilesheetCanvas!: HTMLCanvasElement;
  public tileSize = 32;

  // Static Sprites
  public floorSprite!: Sprite;
  public wallSprite!: Sprite;
  public wallTopSprite!: Sprite;
  public doorClosedSprite!: Sprite;
  public doorOpenSprite!: Sprite;
  public keySprite!: Sprite;
  public pillarSprite!: Sprite;
  public testSprite!: Sprite;

  // Estate Map Sprites (map-expectation)
  public estateWoodFloorSprite!: Sprite;
  public estateStonePathSprite!: Sprite;
  public estateHedgeSprite!: Sprite;
  public estateWaterSprite!: Sprite;
  public estateSandSprite!: Sprite;
  public estateRugSprite!: Sprite;
  public estateWallSprite!: Sprite;
  public estateBookshelfSprite!: Sprite;
  public estateFountainSprite!: Sprite;

  // Cached player sprite frames
  private playerFrames: Record<string, Sprite[]> = {};

  private constructor() {
    this.generateSpritesheet();
    this.sliceSprites();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Builds the offscreen canvas spritesheet with procedural pixel art.
   */
  private generateSpritesheet(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 32 * 4; // 4 columns (128px)
    canvas.height = 32 * 6; // 6 rows (192px)
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // ----------------------------------------------------
    // ROW 0: Player Walking Down (Frames 0, 1, 2, 3)
    // ----------------------------------------------------
    for (let f = 0; f < 4; f++) {
      const ox = f * 32;
      const oy = 0 * 32;
      this.drawPlayerFrame(ctx, ox, oy, 'down', f);
    }

    // ----------------------------------------------------
    // ROW 1: Player Walking Up (Frames 0, 1, 2, 3)
    // ----------------------------------------------------
    for (let f = 0; f < 4; f++) {
      const ox = f * 32;
      const oy = 1 * 32;
      this.drawPlayerFrame(ctx, ox, oy, 'up', f);
    }

    // ----------------------------------------------------
    // ROW 2: Player Walking Left (Frames 0, 1, 2, 3)
    // ----------------------------------------------------
    for (let f = 0; f < 4; f++) {
      const ox = f * 32;
      const oy = 2 * 32;
      this.drawPlayerFrame(ctx, ox, oy, 'left', f);
    }

    // ----------------------------------------------------
    // ROW 3: Player Walking Right (Frames 0, 1, 2, 3)
    // ----------------------------------------------------
    for (let f = 0; f < 4; f++) {
      const ox = f * 32;
      const oy = 3 * 32;
      this.drawPlayerFrame(ctx, ox, oy, 'right', f);
    }

    // ----------------------------------------------------
    // ROW 4: World Tiles (Col 0: Floor, Col 1: Wall, Col 2: Wall Top, Col 3: Pillar)
    // ----------------------------------------------------
    const s = this.tileSize;
    TileFactory.createTile('floor', s).draw(ctx, 0 * s, 4 * s);
    TileFactory.createTile('wall', s).draw(ctx, 1 * s, 4 * s);
    TileFactory.createTile('wallTop', s).draw(ctx, 2 * s, 4 * s);
    TileFactory.createTile('pillar', s).draw(ctx, 3 * s, 4 * s);

    // ----------------------------------------------------
    // ROW 5: Interactive Entities (Col 0: Closed Door, Col 1: Open Door, Col 2: Golden Key)
    // ----------------------------------------------------
    TileFactory.createTile('doorClosed', s).draw(ctx, 0 * s, 5 * s);
    TileFactory.createTile('doorOpen', s).draw(ctx, 1 * s, 5 * s);
    TileFactory.createTile('key', s).draw(ctx, 2 * s, 5 * s);

    this.tilesheetCanvas = canvas;
  }

  /**
   * Generates a single 32x32 player character frame.
   */
  private drawPlayerFrame(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    direction: 'up' | 'down' | 'left' | 'right',
    frame: number
  ): void {
    // Helper to draw pixel
    const p = (x: number, y: number, color: string, w = 1, h = 1): void => {
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, w, h);
    };

    // Leg walk cycle offset
    const legOffset = frame === 1 ? -2 : frame === 3 ? 2 : 0;
    const bobY = frame === 1 || frame === 3 ? 1 : 0;

    // Palette
    const cSkin = '#fbcfe8'; // light skin
    const cHair = '#78350f'; // brown hair
    const cCap = '#0284c7'; // cyan/blue hero cap
    const cTunic = '#0369a1'; // deep blue tunic
    const cBelt = '#d97706'; // gold/brown belt
    const cPants = '#1e293b'; // dark slate pants
    const cBoots = '#451a03'; // leather boots
    const cEyes = '#0f172a'; // dark eyes
    const cBackpack = '#b45309'; // leather backpack

    if (direction === 'down') {
      // Hair/Cap
      p(10, 4 + bobY, cCap, 12, 6);
      p(9, 7 + bobY, cHair, 14, 3);
      // Face
      p(10, 10 + bobY, cSkin, 12, 6);
      // Eyes
      p(12, 12 + bobY, cEyes, 2, 2);
      p(18, 12 + bobY, cEyes, 2, 2);
      // Tunic
      p(9, 16 + bobY, cTunic, 14, 7);
      // Belt
      p(9, 21 + bobY, cBelt, 14, 2);
      p(15, 21 + bobY, '#fde047', 2, 2); // buckle
      // Pants & Legs
      p(10, 23, cPants, 5, 4 + legOffset);
      p(17, 23, cPants, 5, 4 - legOffset);
      // Boots
      p(10, 27 + Math.max(0, legOffset), cBoots, 5, 3);
      p(17, 27 + Math.max(0, -legOffset), cBoots, 5, 3);
    } else if (direction === 'up') {
      // Cap/Hair from back
      p(10, 4 + bobY, cCap, 12, 7);
      p(9, 10 + bobY, cHair, 14, 5);
      // Backpack
      p(11, 15 + bobY, cBackpack, 10, 7);
      p(9, 16 + bobY, cTunic, 2, 6);
      p(21, 16 + bobY, cTunic, 2, 6);
      // Pants
      p(10, 23, cPants, 5, 4 + legOffset);
      p(17, 23, cPants, 5, 4 - legOffset);
      // Boots
      p(10, 27 + Math.max(0, legOffset), cBoots, 5, 3);
      p(17, 27 + Math.max(0, -legOffset), cBoots, 5, 3);
    } else if (direction === 'left') {
      // Side profile Left
      p(10, 4 + bobY, cCap, 10, 6);
      p(9, 8 + bobY, cHair, 7, 5);
      p(9, 11 + bobY, cSkin, 8, 5);
      // Single Eye
      p(11, 12 + bobY, cEyes, 2, 2);
      // Backpack visible on right side
      p(17, 15 + bobY, cBackpack, 4, 7);
      // Tunic
      p(10, 16 + bobY, cTunic, 8, 6);
      p(9, 21 + bobY, cBelt, 9, 2);
      // Legs
      p(11 + legOffset, 23, cPants, 5, 4);
      p(15 - legOffset, 23, cPants, 5, 4);
      // Boots
      p(10 + legOffset, 27, cBoots, 6, 3);
      p(15 - legOffset, 27, cBoots, 6, 3);
    } else if (direction === 'right') {
      // Side profile Right
      p(12, 4 + bobY, cCap, 10, 6);
      p(16, 8 + bobY, cHair, 7, 5);
      p(15, 11 + bobY, cSkin, 8, 5);
      // Single Eye
      p(19, 12 + bobY, cEyes, 2, 2);
      // Backpack visible on left side
      p(11, 15 + bobY, cBackpack, 4, 7);
      // Tunic
      p(14, 16 + bobY, cTunic, 8, 6);
      p(14, 21 + bobY, cBelt, 9, 2);
      // Legs
      p(12 - legOffset, 23, cPants, 5, 4);
      p(16 + legOffset, 23, cPants, 5, 4);
      // Boots
      p(11 - legOffset, 27, cBoots, 6, 3);
      p(16 + legOffset, 27, cBoots, 6, 3);
    }
  }

  /**
   * Slices tiles and frames from the generated spritesheet.
   */
  private sliceSprites(): void {
    const s = this.tileSize;

    // Tiles
    this.floorSprite = new Sprite(this.tilesheetCanvas, 0 * s, 4 * s, s, s);
    this.wallSprite = new Sprite(this.tilesheetCanvas, 1 * s, 4 * s, s, s);
    this.wallTopSprite = new Sprite(this.tilesheetCanvas, 2 * s, 4 * s, s, s);
    this.pillarSprite = new Sprite(this.tilesheetCanvas, 3 * s, 4 * s, s, s);

    // Items and Doors
    this.doorClosedSprite = new Sprite(this.tilesheetCanvas, 0 * s, 5 * s, s, s);
    this.doorOpenSprite = new Sprite(this.tilesheetCanvas, 1 * s, 5 * s, s, s);
    this.keySprite = new Sprite(this.tilesheetCanvas, 2 * s, 5 * s, s, s);

    // Estate Map Sprites
    this.estateWoodFloorSprite = TileFactory.createTile('estate_wood_floor', s).toSprite();
    this.estateStonePathSprite = TileFactory.createTile('estate_stone_path', s).toSprite();
    this.estateHedgeSprite = TileFactory.createTile('estate_hedge', s).toSprite();
    this.estateWaterSprite = TileFactory.createTile('estate_water', s).toSprite();
    this.estateSandSprite = TileFactory.createTile('estate_sand', s).toSprite();
    this.estateRugSprite = TileFactory.createTile('estate_rug', s).toSprite();
    this.estateWallSprite = TileFactory.createTile('estate_wall', s).toSprite();
    this.estateBookshelfSprite = TileFactory.createTile('estate_bookshelf', s).toSprite();
    this.estateFountainSprite = TileFactory.createTile('estate_fountain', s).toSprite();

    // Player Directional Frames
    const directions = ['down', 'up', 'left', 'right'] as const;
    directions.forEach((dir, rowIndex) => {
      const frames: Sprite[] = [];
      for (let col = 0; col < 4; col++) {
        frames.push(new Sprite(this.tilesheetCanvas, col * s, rowIndex * s, s, s));
      }
      this.playerFrames[dir] = frames;
    });
  }

  /**
   * Carga una hoja de sprites externa (como /sprites/hero.png) y mapea sus fotogramas.
   * La hoja tiene 8 columnas de animación por 4 filas direccionales:
   * Fila 0: Derecha (right)
   * Fila 1: Izquierda (left)
   * Fila 2: Abajo (down)
   * Fila 3: Arriba (up)
   */
  public async loadHeroSpriteSheet(url = '/sprites/hero.png'): Promise<void> {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(new Error(`Error cargando imagen en ${url}: ${e}`));
    });

    // Cargar metadatos si existen
    let cols = 4;
    let rows = 4;
    let directions: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];

    try {
      const res = await fetch('/sprites/hero.json');
      if (res.ok) {
        const meta = await res.json();
        if (meta.cols) cols = meta.cols;
        if (meta.rows) rows = meta.rows;
        if (Array.isArray(meta.directions)) directions = meta.directions;
      }
    } catch {
      // Usar defaults
    }

    const frameWidth = Math.floor(img.naturalWidth / cols);
    const frameHeight = Math.floor(img.naturalHeight / rows);
    const sheet = new SpriteSheet(img, frameWidth, frameHeight, cols, rows);

    for (let r = 0; r < directions.length; r++) {
      const dir = directions[r];
      const frames: Sprite[] = [];
      for (let c = 0; c < cols; c++) {
        frames.push(sheet.getSprite(c, r));
      }
      this.playerFrames[dir] = frames;
    }
  }

  public heroIdleSprite: Sprite | null = null;

  public async loadHeroIdleSprite(url = '/sprites/hero-idle.png'): Promise<void> {
    try {
      const img = new Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('No idle sprite found'));
      });
      this.heroIdleSprite = new Sprite(img, 0, 0, img.naturalWidth, img.naturalHeight);
    } catch {
      this.heroIdleSprite = null;
    }
  }

  /**
   * Carga una imagen de tileset externa (como /sprites/tileset.png) para reemplazar
   * los sprites del entorno (suelo, paredes, pilares, puertas y llave).
   */
  public async loadCustomTileset(url = '/sprites/tileset.png', tileSize = 32): Promise<void> {
    try {
      const sheet = await SpriteSheet.load(url, tileSize, tileSize);
      this.floorSprite = sheet.getSprite(0, 0);
      this.wallSprite = sheet.getSprite(1, 0);
      this.wallTopSprite = sheet.getSprite(2, 0);
      this.pillarSprite = sheet.getSprite(3, 0);
      this.doorClosedSprite = sheet.getSprite(0, 1);
      this.doorOpenSprite = sheet.getSprite(1, 1);
      this.keySprite = sheet.getSprite(2, 1);
      console.log(`Tileset cargado exitosamente desde ${url}`);
    } catch (err) {
      console.warn(`No se encontró tileset en ${url}, manteniendo gráficos generados.`, err);
    }
  }

  public estateMapImage: HTMLImageElement | null = null;
  public collisionMaskImage: HTMLImageElement | null = null;
  public estateForegroundImage: HTMLImageElement | null = null;

  /**
   * Carga la imagen de alta definición del mapa de la finca (map-expectation).
   */
  public async loadEstateMap(url = '/maps/estate-map.webp'): Promise<HTMLImageElement> {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => {
        // Intento de respaldo con formato PNG
        img.src = '/maps/estate-map.png';
        img.onload = () => resolve();
        img.onerror = (e) => reject(new Error(`No se pudo cargar la imagen del mapa en ${url}: ${e}`));
      };
    });
    this.estateMapImage = img;
    return img;
  }

  /**
   * Carga la capa de primer plano / dosel (overhead canopy layer) que se dibuja sobre el jugador y objetos.
   * Si el archivo no existe todavía, no arroja error para permitir que el juego continúe con normalidad.
   */
  public async loadEstateForeground(url = '/maps/estate-foreground.png'): Promise<HTMLImageElement | null> {
    const img = new Image();
    img.src = url;
    const loaded = await new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => {
        // Intento de respaldo con formato WebP
        const fallback = new Image();
        fallback.src = '/maps/estate-foreground.webp';
        fallback.onload = () => {
          this.estateForegroundImage = fallback;
          resolve(true);
        };
        fallback.onerror = () => {
          console.info(
            '[AssetManager] Capa de primer plano opcional no encontrada. ' +
              'Agrega tu imagen en public/maps/estate-foreground.png (1600x1066) con transparencia para activarla.'
          );
          resolve(false);
        };
      };
    });

    if (loaded && !this.estateForegroundImage) {
      this.estateForegroundImage = img;
    }
    return this.estateForegroundImage;
  }

  /**
   * Carga la imagen de máscara de colisión (blanco = transitable, negro = obstáculo).
   */
  public async loadCollisionMask(url = '/maps/estate-collision.png'): Promise<HTMLImageElement> {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(new Error(`No se pudo cargar la máscara de colisión en ${url}: ${e}`));
    });
    this.collisionMaskImage = img;
    return img;
  }

  /**
   * Crea una instancia de CollisionMask a partir de la imagen cargada.
   */
  public createCollisionMask(width = 1600, height = 1066): CollisionMask | null {
    if (!this.collisionMaskImage) {
      console.warn('No hay imagen de máscara de colisión cargada.');
      return null;
    }
    return CollisionMask.fromImage(this.collisionMaskImage, width, height);
  }

  /**
   * Actualiza el contenido gráfico de un sprite existente en caliente (in-place).
   * Al mutar la propiedad source y coordenadas del objeto Sprite existente,
   * cualquier entidad o mapa (TileMap, StaticObstacle, Door, KeyItem) que mantenga
   * una referencia al sprite reflejará el cambio de inmediato en el siguiente ciclo RAF.
   */
  public updateTileSprite(
    target:
      | 'floorSprite'
      | 'wallSprite'
      | 'wallTopSprite'
      | 'pillarSprite'
      | 'doorClosedSprite'
      | 'doorOpenSprite'
      | 'keySprite',
    newSource: CanvasImageSource,
    width = 32,
    height = 32
  ): void {
    const sprite = this[target];
    if (sprite) {
      sprite.source = newSource;
      sprite.sx = 0;
      sprite.sy = 0;
      sprite.sWidth = width;
      sprite.sHeight = height;
    }
  }

  /**
   * Constructs an AnimatedSprite for the player with all 4 directions and idle states.
   */
  public createPlayerAnimator(): AnimatedSprite {
    const animator = new AnimatedSprite();
    const directions = ['down', 'up', 'left', 'right'] as const;

    for (const dir of directions) {
      const allFrames = this.playerFrames[dir] || [];
      if (allFrames.length === 0) continue;

      if (allFrames.length >= 8) {
        // Ciclo de 8 fotogramas
        const idleFrame = (dir === 'down' && this.heroIdleSprite)
          ? this.heroIdleSprite
          : (allFrames[4] ?? allFrames[0]);

        animator.addClip({
          name: `idle_${dir}`,
          frames: [idleFrame],
          frameDuration: 0.5,
          loop: true,
        });

        animator.addClip({
          name: `walk_${dir}`,
          frames: allFrames,
          frameDuration: 0.08,
          loop: true,
        });
      } else {
        // Ciclo clásico de 4 fotogramas (Paso 1, Reposo, Paso 2, Reposo)
        animator.addClip({
          name: `idle_${dir}`,
          frames: [allFrames[0]],
          frameDuration: 0.5,
          loop: true,
        });

        animator.addClip({
          name: `walk_${dir}`,
          frames: allFrames.length === 4
            ? [allFrames[1], allFrames[2], allFrames[3], allFrames[0]]
            : allFrames,
          frameDuration: 0.14,
          loop: true,
        });
      }
    }

    animator.play('idle_down');
    return animator;
  }
}
