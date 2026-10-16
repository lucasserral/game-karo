import { GameObject } from '../core/GameObject.ts';
import { Actor } from '../entities/Actor.ts';
import { Player } from '../entities/Player.ts';
import { isCollidable } from '../core/ICollidable.ts';
import { isInteractive, type IInteractive } from '../core/IInteractive.ts';
import type { TileMap } from './TileMap.ts';
import type { Camera } from '../core/Camera.ts';

/**
 * World maintains the active scene, handles decoupled physical collisions,
 * manages entity lifecycles, and performs depth-sorted rendering.
 */
export class World {
  public entities: GameObject[] = [];
  public player: Player;
  public tileMap: TileMap;

  constructor(tileMap: TileMap, player: Player) {
    this.tileMap = tileMap;
    this.player = player;
    this.addEntity(player);
  }

  public addEntity(entity: GameObject): void {
    this.entities.push(entity);
  }

  public removeEntity(entity: GameObject): void {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
    }
  }

  /**
   * Finds the closest interactive entity within interaction range.
   */
  public findNearestInteractive(player: Player): (GameObject & IInteractive) | null {
    let closest: (GameObject & IInteractive) | null = null;
    let minDistance = Infinity;

    for (const entity of this.entities) {
      if (entity === player || entity.isDestroyed) {
        continue;
      }

      if (isInteractive(entity) && entity.canInteract(player)) {
        const dist = player.getCenter().distanceTo(entity.getCenter());
        if (dist < minDistance) {
          minDistance = dist;
          closest = entity as GameObject & IInteractive;
        }
      }
    }

    return closest;
  }

  /**
   * Resolves physical collision with decoupled X and Y axis testing.
   * This guarantees smooth wall sliding when moving diagonally into obstacles.
   */
  private resolveActorMovement(actor: Actor, dt: number): void {
    const dx = actor.velocity.x * dt;
    const dy = actor.velocity.y * dt;

    if (dx === 0 && dy === 0) {
      return;
    }

    // --- 1. X-AXIS MOVEMENT ---
    if (dx !== 0) {
      actor.position.x += dx;
      const currentBox = actor.getCollider();

      for (const other of this.entities) {
        if (other === actor || other.isDestroyed || !isCollidable(other)) {
          continue;
        }

        const otherBox = other.getCollider();
        if (currentBox.intersects(otherBox)) {
          // Trigger collision hook
          if (other.onCollision) {
            other.onCollision(actor, dx > 0 ? -1 : 1, 0);
          }

          // Impenetrable obstacle resolution
          if (other.isSolid()) {
            if (dx > 0) {
              actor.position.x = otherBox.left - actor.colliderOffset.x - actor.colliderSize.x;
            } else {
              actor.position.x = otherBox.right - actor.colliderOffset.x;
            }
          }
        }
      }
    }

    // --- 2. Y-AXIS MOVEMENT ---
    if (dy !== 0) {
      actor.position.y += dy;
      const currentBox = actor.getCollider();

      for (const other of this.entities) {
        if (other === actor || other.isDestroyed || !isCollidable(other)) {
          continue;
        }

        const otherBox = other.getCollider();
        if (currentBox.intersects(otherBox)) {
          // Trigger collision hook
          if (other.onCollision) {
            other.onCollision(actor, 0, dy > 0 ? -1 : 1);
          }

          // Impenetrable obstacle resolution
          if (other.isSolid()) {
            if (dy > 0) {
              actor.position.y = otherBox.top - actor.colliderOffset.y - actor.colliderSize.y;
            } else {
              actor.position.y = otherBox.bottom - actor.colliderOffset.y;
            }
          }
        }
      }
    }

    // --- 3. CLAMP TO WORLD BOUNDS ---
    const minX = 0;
    const maxX = this.tileMap.worldWidth - actor.size.x;
    const minY = 0;
    const maxY = this.tileMap.worldHeight - actor.size.y;

    actor.position.x = Math.max(minX, Math.min(actor.position.x, maxX));
    actor.position.y = Math.max(minY, Math.min(actor.position.y, maxY));
  }

  public update(dt: number): void {
    // 1. Update entities
    for (const entity of this.entities) {
      if (!entity.isDestroyed) {
        entity.update(dt);

        if (entity instanceof Actor) {
          this.resolveActorMovement(entity, dt);
        }
      }
    }

    // 2. Cleanup destroyed entities
    this.entities = this.entities.filter((e) => !e.isDestroyed);
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // 1. Render floor tiles
    this.tileMap.render(ctx, camera);

    // 2. Frustum culling: filter entities in view
    const visibleEntities = this.entities.filter((entity) =>
      camera.isVisible(entity.getBounds())
    );

    // 3. Depth Sorting: sort by zIndex, then Y-sort by base position
    visibleEntities.sort((a, b) => {
      if (a.zIndex !== b.zIndex) {
        return a.zIndex - b.zIndex;
      }
      return (a.position.y + a.size.y) - (b.position.y + b.size.y);
    });

    // 4. Polymorphic render calls
    for (const entity of visibleEntities) {
      entity.render(ctx, camera);
    }
  }
}
