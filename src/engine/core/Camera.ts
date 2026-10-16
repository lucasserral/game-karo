import { Vector2D } from '../math/Vector2D.ts';
import { BoundingBox } from '../math/BoundingBox.ts';

export interface CameraBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Top-down camera that follows a target with smooth interpolation and boundary clamping.
 */
export class Camera {
  public position: Vector2D; // Top-left of camera in world coordinates
  public viewportWidth: number;
  public viewportHeight: number;
  public zoom: number;
  public lerpFactor: number;
  public bounds: CameraBounds | null;

  constructor(viewportWidth: number, viewportHeight: number, zoom = 1, lerpFactor = 0.1) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.zoom = zoom;
    this.lerpFactor = lerpFactor;
    this.position = new Vector2D(0, 0);
    this.bounds = null;
  }

  public setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.bounds = { minX, minY, maxX, maxY };
  }

  public setViewportSize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * Smoothly moves camera to center on target position.
   */
  public follow(targetWorldCenter: Vector2D, dt: number): void {
    // Effective visible area in world coordinates
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;

    // Desired top-left world position
    const desiredX = targetWorldCenter.x - visibleWidth / 2;
    const desiredY = targetWorldCenter.y - visibleHeight / 2;

    // Lerp smoothing (time-step corrected)
    const factor = Math.min(1, this.lerpFactor * (dt * 60));
    this.position.x += (desiredX - this.position.x) * factor;
    this.position.y += (desiredY - this.position.y) * factor;

    // Clamp to map boundaries if set
    if (this.bounds) {
      const maxCamX = Math.max(this.bounds.minX, this.bounds.maxX - visibleWidth);
      const maxCamY = Math.max(this.bounds.minY, this.bounds.maxY - visibleHeight);

      this.position.x = Math.max(this.bounds.minX, Math.min(this.position.x, maxCamX));
      this.position.y = Math.max(this.bounds.minY, Math.min(this.position.y, maxCamY));
    }
  }

  /**
   * Instantly snaps camera center to target without interpolation.
   */
  public snapTo(targetWorldCenter: Vector2D): void {
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;

    this.position.x = targetWorldCenter.x - visibleWidth / 2;
    this.position.y = targetWorldCenter.y - visibleHeight / 2;

    if (this.bounds) {
      const maxCamX = Math.max(this.bounds.minX, this.bounds.maxX - visibleWidth);
      const maxCamY = Math.max(this.bounds.minY, this.bounds.maxY - visibleHeight);
      this.position.x = Math.max(this.bounds.minX, Math.min(this.position.x, maxCamX));
      this.position.y = Math.max(this.bounds.minY, Math.min(this.position.y, maxCamY));
    }
  }

  public worldToScreen(worldPos: Vector2D): Vector2D {
    return new Vector2D(
      (worldPos.x - this.position.x) * this.zoom,
      (worldPos.y - this.position.y) * this.zoom
    );
  }

  public screenToWorld(screenPos: Vector2D): Vector2D {
    return new Vector2D(
      screenPos.x / this.zoom + this.position.x,
      screenPos.y / this.zoom + this.position.y
    );
  }

  /**
   * Returns a bounding box representing the visible world area.
   */
  public getVisibleBounds(): BoundingBox {
    return new BoundingBox(
      this.position.x,
      this.position.y,
      this.viewportWidth / this.zoom,
      this.viewportHeight / this.zoom
    );
  }

  /**
   * Checks if an AABB is within the camera's view frustum.
   */
  public isVisible(box: BoundingBox): boolean {
    return this.getVisibleBounds().intersects(box);
  }

  /**
   * Applies the camera translation and zoom to canvas 2D context.
   */
  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.floor(this.position.x), -Math.floor(this.position.y));
  }

  /**
   * Restores the canvas context.
   */
  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}
