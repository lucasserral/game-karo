import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

/**
 * PicnicTable: Mesa exterior con mantel rosa y banquete de jardín junto al estanque.
 */
export class PicnicTable extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 65;

  constructor(x = 1110, y = 615, width = 85, height = 75) {
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
      initiator.setNotification('🧺 ¡Disfrutas de frutas frescas y té helado en el jardín con vista al estanque!', 3.5);
    }
    return {
      success: true,
      message: 'Has tomado un aperitivo al aire libre.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.canInteract(initiator)) {
      return '🧺 [E] Probar el banquete del jardín';
    }
    return '';
  }

  public override update(_dt: number): void {}

  public override render(_ctx: CanvasRenderingContext2D, _camera: Camera): void {}
}
