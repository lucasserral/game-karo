import { Sprite } from './Sprite.ts';
import { AnimatedSprite } from './AnimatedSprite.ts';
import { SpriteSheet } from './SpriteSheet.ts';

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

    // Helper: draw pixel block
    const pixel = (x: number, y: number, color: string, w = 1, h = 1): void => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };

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
    // ROW 4: World Tiles (Col 0: Floor, Col 1: Wall, Col 2: Wall Top, Col 3: Tile Decal)
    // ----------------------------------------------------
    // Floor: Dungeon Cobblestone
    const fx = 0 * 32;
    const fy = 4 * 32;
    pixel(fx, fy, '#2b2a3a', 32, 32);
    // Stone bricks outline & textures
    ctx.strokeStyle = '#1d1c29';
    ctx.lineWidth = 1;
    // Brick pattern
    ctx.strokeRect(fx + 1, fy + 1, 14, 9);
    ctx.strokeRect(fx + 17, fy + 1, 14, 9);
    ctx.strokeRect(fx + 1, fy + 11, 20, 9);
    ctx.strokeRect(fx + 22, fy + 11, 9, 9);
    ctx.strokeRect(fx + 1, fy + 21, 14, 10);
    ctx.strokeRect(fx + 17, fy + 21, 14, 10);
    // Highlight flecks
    pixel(fx + 3, fy + 3, '#3d3c52', 2, 2);
    pixel(fx + 19, fy + 4, '#3d3c52', 2, 1);
    pixel(fx + 5, fy + 14, '#38374a', 3, 2);
    pixel(fx + 20, fy + 24, '#38374a', 2, 2);

    // Wall: Solid Fortress Stone Block
    const wx = 1 * 32;
    const wy = 4 * 32;
    pixel(wx, wy, '#4a4f5f', 32, 32);
    // Wall shading
    pixel(wx, wy, '#686f85', 32, 4); // top highlight
    pixel(wx, wy + 28, '#262833', 32, 4); // bottom shadow
    // Mortar lines
    ctx.fillStyle = '#2d303b';
    ctx.fillRect(wx, wy + 10, 32, 2);
    ctx.fillRect(wx, wy + 20, 32, 2);
    ctx.fillRect(wx + 15, wy, 2, 10);
    ctx.fillRect(wx + 7, wy + 12, 2, 8);
    ctx.fillRect(wx + 23, wy + 12, 2, 8);
    ctx.fillRect(wx + 15, wy + 22, 2, 8);
    // Cracks / texture
    pixel(wx + 4, wy + 4, '#7a829c', 2, 2);
    pixel(wx + 20, wy + 14, '#373a47', 3, 2);

    // Wall Top (alternative or border trim)
    const tx = 2 * 32;
    const ty = 4 * 32;
    pixel(tx, ty, '#3a3e4c', 32, 32);
    pixel(tx, ty, '#52576b', 32, 2);
    pixel(tx + 2, ty + 4, '#6b728c', 28, 24);
    pixel(tx + 4, ty + 6, '#464a5c', 24, 20);

    // Pillar / Decorated Obstacle
    const px = 3 * 32;
    const py = 4 * 32;
    pixel(px, py, '#2b2a3a', 32, 32);
    pixel(px + 4, py + 2, '#64748b', 24, 28);
    pixel(px + 6, py + 4, '#94a3b8', 20, 6);
    pixel(px + 8, py + 10, '#475569', 16, 14);
    pixel(px + 6, py + 24, '#334155', 20, 6);
    pixel(px + 12, py + 14, '#38bdf8', 8, 6); // glowing blue gem

    // ----------------------------------------------------
    // ROW 5: Interactive Entities (Col 0: Closed Door, Col 1: Open Door, Col 2: Golden Key)
    // ----------------------------------------------------
    // Door Closed: Sturdy wooden door with iron rivets and lock
    const dcx = 0 * 32;
    const dcy = 5 * 32;
    // Arch frame
    pixel(dcx, dcy, '#333745', 32, 32);
    // Wood panels
    pixel(dcx + 4, dcy + 2, '#854d0e', 24, 30);
    // Wood planks separation
    pixel(dcx + 11, dcy + 2, '#533108', 2, 30);
    pixel(dcx + 19, dcy + 2, '#533108', 2, 30);
    // Iron bands
    pixel(dcx + 4, dcy + 7, '#64748b', 24, 3);
    pixel(dcx + 4, dcy + 22, '#64748b', 24, 3);
    // Golden Keyhole Lock
    pixel(dcx + 13, dcy + 14, '#facc15', 6, 6);
    pixel(dcx + 15, dcy + 15, '#000000', 2, 2);
    pixel(dcx + 15, dcy + 17, '#000000', 2, 2);

    // Door Open: Open passage
    const dox = 1 * 32;
    const doy = 5 * 32;
    pixel(dox, doy, '#333745', 32, 32);
    // Dark open doorway
    pixel(dox + 4, doy + 4, '#0f172a', 24, 28);
    pixel(dox + 6, doy + 6, '#1e293b', 20, 26);
    // Open door leaf swung back
    pixel(dox + 2, doy + 2, '#854d0e', 3, 30);
    pixel(dox + 27, doy + 2, '#854d0e', 3, 30);

    // Golden Key: Floating shiny key
    const kx = 2 * 32;
    const ky = 5 * 32;
    // Transparent background
    // Key head (ring)
    pixel(kx + 11, ky + 6, '#facc15', 10, 10);
    pixel(kx + 13, ky + 8, '#2b2a3a', 6, 6);
    // Key shaft
    pixel(kx + 15, ky + 16, '#facc15', 3, 10);
    // Key teeth
    pixel(kx + 18, ky + 20, '#facc15', 4, 2);
    pixel(kx + 18, ky + 24, '#facc15', 3, 2);
    // Key highlights
    pixel(kx + 12, ky + 7, '#fef08a', 2, 2);
    pixel(kx + 15, ky + 17, '#fef08a', 1, 6);

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
        const idleFrame = allFrames[4] ?? allFrames[0];
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
