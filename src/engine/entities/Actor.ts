import { GameObject } from '../core/GameObject.ts';
import { Vector2D } from '../math/Vector2D.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type ActorState = 'idle' | 'walk';

/**
 * Abstract class for dynamic, movable entities.
 * Inherits GameObject and implements ICollidable.
 */
export abstract class Actor extends GameObject implements ICollidable {
  public velocity: Vector2D;
  public speed: number;
  public facingDirection: Direction;
  public state: ActorState;

  // Collision box offset and dimensions (typically around the feet for 2D top-down perspective)
  public colliderOffset: Vector2D;
  public colliderSize: Vector2D;

  constructor(
    x: number,
    y: number,
    width = 32,
    height = 32,
    speed = 120,
    zIndex = 10
  ) {
    super(x, y, width, height, zIndex);
    this.velocity = Vector2D.zero();
    this.speed = speed;
    this.facingDirection = 'down';
    this.state = 'idle';

    // Default collider: bottom half of the sprite
    this.colliderOffset = new Vector2D(6, 16);
    this.colliderSize = new Vector2D(20, 14);
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(
      this.position.x + this.colliderOffset.x,
      this.position.y + this.colliderOffset.y,
      this.colliderSize.x,
      this.colliderSize.y
    );
  }

  public isSolid(): boolean {
    return true;
  }

  /**
   * Sets facing direction and state based on motion vector.
   */
  public updateOrientation(movement: Vector2D): void {
    if (movement.isZero()) {
      this.state = 'idle';
      return;
    }

    this.state = 'walk';

    // Prioritize dominant axis for clean 4-way visual orientation
    if (Math.abs(movement.x) > Math.abs(movement.y)) {
      this.facingDirection = movement.x > 0 ? 'right' : 'left';
    } else {
      this.facingDirection = movement.y > 0 ? 'down' : 'up';
    }
  }
}
