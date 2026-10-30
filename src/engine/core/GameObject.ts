import { Vector2D } from '../math/Vector2D.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { Camera } from './Camera.ts';

let nextEntityId = 1;

/**
 * Abstract base class for all game objects.
 * Enforces polymorphism for update and rendering cycles.
 */
export abstract class GameObject {
  public readonly id: string;
  public position: Vector2D;
  public size: Vector2D;
  public zIndex: number;
  public isDestroyed: boolean;
  public colliderShape: 'rectangle' | 'oval' = 'rectangle';

  constructor(x = 0, y = 0, width = 32, height = 32, zIndex = 0) {
    this.id = `entity_${nextEntityId++}`;
    this.position = new Vector2D(x, y);
    this.size = new Vector2D(width, height);
    this.zIndex = zIndex;
    this.isDestroyed = false;
    this.colliderShape = 'rectangle';
  }

  /**
   * Updates internal state per frame.
   * @param dt Delta time in seconds.
   */
  public abstract update(dt: number): void;

  /**
   * Renders the entity on the canvas.
   * @param ctx Canvas 2D context (with camera transform already applied).
   * @param camera Camera reference for culling or screen-space adjustments.
   */
  public abstract render(ctx: CanvasRenderingContext2D, camera: Camera): void;

  public getCenter(): Vector2D {
    return new Vector2D(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2);
  }

  public getBounds(): BoundingBox {
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  public destroy(): void {
    this.isDestroyed = true;
  }
}
