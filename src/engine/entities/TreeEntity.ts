import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { Camera } from '../core/Camera.ts';

/**
 * TreeEntity: Tronco de árbol centenario en el parque de la finca.
 * Define la colisión física en la base del tronco (AABB) permitiendo que el jugador
 * rodee el árbol y camine bajo su sombra.
 */
export class TreeEntity extends GameObject implements ICollidable {
  constructor(trunkX: number, trunkY: number, width = 28, height = 22) {
    super(trunkX, trunkY, width, height, 12);
  }

  public isSolid(): boolean {
    return true;
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  public override update(_dt: number): void {}

  public override render(_ctx: CanvasRenderingContext2D, _camera: Camera): void {
    // La copa y tronco ya forman parte del mapa
  }
}
