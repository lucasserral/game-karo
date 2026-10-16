import { BoundingBox } from '../math/BoundingBox.ts';
import type { GameObject } from './GameObject.ts';

/**
 * Interface for game objects that have physical presence and passive collision responses.
 */
export interface ICollidable {
  /**
   * Returns the current bounding box used for collision resolution.
   */
  getCollider(): BoundingBox;

  /**
   * Indicates if this object acts as an impenetrable physical obstacle.
   */
  isSolid(): boolean;

  /**
   * Optional hook invoked when a collision occurs with another GameObject.
   */
  onCollision?(other: GameObject, normalX: number, normalY: number): void;
}

/**
 * Type guard for ICollidable.
 */
export function isCollidable(obj: unknown): obj is ICollidable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'getCollider' in obj &&
    'isSolid' in obj &&
    typeof (obj as ICollidable).getCollider === 'function' &&
    typeof (obj as ICollidable).isSolid === 'function'
  );
}
