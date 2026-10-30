import { Vector2D } from './Vector2D.ts';

/**
 * Axis-Aligned Bounding Box (AABB) for 2D spatial queries and collisions.
 */
export class BoundingBox {
  public position: Vector2D;
  public size: Vector2D;

  constructor(x: number, y: number, width: number, height: number) {
    this.position = new Vector2D(x, y);
    this.size = new Vector2D(width, height);
  }

  public get left(): number {
    return this.position.x;
  }

  public get right(): number {
    return this.position.x + this.size.x;
  }

  public get top(): number {
    return this.position.y;
  }

  public get bottom(): number {
    return this.position.y + this.size.y;
  }

  public get width(): number {
    return this.size.x;
  }

  public get height(): number {
    return this.size.y;
  }

  public get centerX(): number {
    return this.position.x + this.size.x / 2;
  }

  public get centerY(): number {
    return this.position.y + this.size.y / 2;
  }

  /**
   * Checks if this bounding box intersects another AABB.
   */
  public intersects(other: BoundingBox): boolean {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  /**
   * Checks if this bounding box intersects an elliptical collider (ovaloid).
   */
  public intersectsEllipse(other: BoundingBox): boolean {
    const cx = other.centerX;
    const cy = other.centerY;
    const rx = other.width / 2;
    const ry = other.height / 2;
    if (rx <= 0 || ry <= 0) return false;

    // Find closest point on this AABB to ellipse center
    const closestX = Math.max(this.left, Math.min(cx, this.right));
    const closestY = Math.max(this.top, Math.min(cy, this.bottom));

    const dx = (closestX - cx) / rx;
    const dy = (closestY - cy) / ry;
    return dx * dx + dy * dy <= 1.0;
  }

  /**
   * Checks if a point lies within this bounding box.
   */
  public containsPoint(point: Vector2D): boolean {
    return (
      point.x >= this.left &&
      point.x <= this.right &&
      point.y >= this.top &&
      point.y <= this.bottom
    );
  }

  /**
   * Computes overlap vector between two colliding bounding boxes.
   */
  public getOverlap(other: BoundingBox): Vector2D | null {
    if (!this.intersects(other)) {
      return null;
    }

    const overlapX = Math.min(this.right, other.right) - Math.max(this.left, other.left);
    const overlapY = Math.min(this.bottom, other.bottom) - Math.max(this.top, other.top);

    return new Vector2D(overlapX, overlapY);
  }

  public clone(): BoundingBox {
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }
}
