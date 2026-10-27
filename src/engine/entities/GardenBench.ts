import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

/**
 * GardenBench: Banco blanco de forja o madera instalado a lo largo de los senderos.
 */
export class GardenBench extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 50;

  constructor(x: number, y: number, width = 36, height = 30) {
    super(x, y, width, height, 6);
  }

  public isSolid(): boolean {
    return true;
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  public canInteract(initiator: GameObject): boolean {
    const dist = this.getCenter().distanceTo(initiator.getCenter());
    return dist <= this.interactionRadius;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (initiator instanceof Player) {
      initiator.setNotification('🪑 Te sientas a contemplar las flores y escuchar el canto de las aves en los árboles.', 3.5);
    }
    return {
      success: true,
      message: 'Te has sentado en el banco de jardín.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.canInteract(initiator)) {
      return '🪑 [E] Sentarse a descansar en el banco';
    }
    return '';
  }

  public override update(_dt: number): void {}

  public override render(_ctx: CanvasRenderingContext2D, _camera: Camera): void {}
}
