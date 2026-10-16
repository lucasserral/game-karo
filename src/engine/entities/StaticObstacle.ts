import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { Sprite } from '../graphics/Sprite.ts';
import type { Camera } from '../core/Camera.ts';

export type ObstacleType = 'wall' | 'pillar';

/**
 * Static physical barrier that prevents actors from passing through (passive collision).
 */
export class StaticObstacle extends GameObject implements ICollidable {
  private sprite: Sprite;
  public readonly obstacleType: ObstacleType;

  constructor(
    x: number,
    y: number,
    sprite: Sprite,
    type: ObstacleType = 'wall',
    width = 32,
    height = 32
  ) {
    super(x, y, width, height, 5); // zIndex 5 (rendered above floor, below player)
    this.sprite = sprite;
    this.obstacleType = type;
  }

  public getCollider(): BoundingBox {
    // Exact bounding box of the obstacle
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  public isSolid(): boolean {
    return true;
  }

  public override update(_dt: number): void {
    // Static objects do not have dynamic updates
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    this.sprite.draw(
      ctx,
      Math.floor(this.position.x),
      Math.floor(this.position.y),
      this.size.x,
      this.size.y
    );
  }
}
