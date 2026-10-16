import { InputManager } from './InputManager.ts';
import { Camera } from './Camera.ts';
import type { World } from '../world/World.ts';

export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
  zoom?: number;
}

/**
 * GameEngine drives the main RAF loop, updates the world, applies the camera,
 * and manages interactions and focus state.
 */
export class GameEngine {
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  public readonly input: InputManager;
  public readonly camera: Camera;
  public world!: World;

  private isRunning = false;
  private lastTime = 0;
  private animFrameId: number | null = null;
  public currentInteractivePrompt = '';

  constructor(options: GameEngineOptions) {
    this.canvas = options.canvas;
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not obtain 2D rendering context for Canvas.');
    }
    this.ctx = context;

    // Enforce crisp pixel art
    this.ctx.imageSmoothingEnabled = false;

    const zoom = options.zoom ?? 2; // Default 2x zoom for retro aesthetic
    this.camera = new Camera(this.canvas.width, this.canvas.height, zoom, 0.12);
    this.input = new InputManager(this.canvas);

    // Re-apply crisp settings on resize
    window.addEventListener('resize', this.handleResize);
  }

  public setWorld(world: World): void {
    this.world = world;

    // Clamp camera within world bounds
    this.camera.setBounds(0, 0, world.tileMap.worldWidth, world.tileMap.worldHeight);

    // Snap camera immediately to player starting location
    this.camera.snapTo(world.player.getCenter());
  }

  private handleResize = (): void => {
    // Keep internal canvas resolution matched with display CSS size
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(rect.width * dpr);
      this.canvas.height = Math.floor(rect.height * dpr);
      this.ctx.imageSmoothingEnabled = false;
      this.camera.setViewportSize(this.canvas.width, this.canvas.height);
    }
  };

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Compute delta time (capped to 0.1s to prevent physics explosions after pauses)
    const rawDt = (currentTime - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    // Reset single-frame input states
    this.input.endFrame();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    if (!this.world) return;

    // 1. Check for Active Interactions
    const target = this.world.findNearestInteractive(this.world.player);
    if (target) {
      this.currentInteractivePrompt = target.getInteractionPrompt(this.world.player);

      if (this.input.isInteractJustPressed()) {
        target.interact(this.world.player);
      }
    } else {
      this.currentInteractivePrompt = '';
    }

    // 2. Update World physics & entities
    this.world.update(dt);

    // 3. Smooth Camera Follow
    this.camera.follow(this.world.player.getCenter(), dt);
  }

  private render(): void {
    if (!this.world) return;

    // Clear canvas
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply Camera translation & zoom
    this.camera.applyTransform(this.ctx);

    // Render World entities and tiles
    this.world.render(this.ctx, this.camera);

    // Restore Camera transform
    this.camera.restoreTransform(this.ctx);

    // Render In-Canvas HUD overlay
    this.renderHUD();
  }

  private renderHUD(): void {
    // 1. Interactive action prompt in bottom center
    if (this.currentInteractivePrompt) {
      this.ctx.save();
      this.ctx.font = 'bold 14px "Outfit", system-ui, sans-serif';
      const text = this.currentInteractivePrompt;
      const textMetrics = this.ctx.measureText(text);
      const bgW = textMetrics.width + 24;
      const bgH = 34;
      const bgX = (this.canvas.width - bgW) / 2;
      const bgY = this.canvas.height - 54;

      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.roundRect(bgX, bgY, bgW, bgH, 8);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#f8fafc';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(text, this.canvas.width / 2, bgY + bgH / 2);
      this.ctx.restore();
    }

    // 2. Unfocused overlay banner
    if (!this.input.isFocused()) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const msg = '🎮 Haz click en la pantalla para enfocar y jugar';
      this.ctx.font = 'bold 16px "Outfit", system-ui, sans-serif';
      const tw = this.ctx.measureText(msg).width;
      const bw = tw + 32;
      const bh = 42;
      const bx = (this.canvas.width - bw) / 2;
      const by = (this.canvas.height - bh) / 2;

      this.ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(bx, by, bw, bh, 10);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(msg, this.canvas.width / 2, by + bh / 2);
      this.ctx.restore();
    }
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.input.destroy();
  }
}
