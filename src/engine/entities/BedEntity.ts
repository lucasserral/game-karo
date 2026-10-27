import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

/**
 * BedEntity: Cama con dosel o cabecero de madera en las habitaciones de la mansión.
 * Permite al jugador descansar y recuperar energía.
 */
export class BedEntity extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 60;
  public readonly bedName: string;

  constructor(x: number, y: number, width: number, height: number, bedName = 'Cama con Dosel') {
    super(x, y, width, height, 6);
    this.bedName = bedName;
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
      initiator.setNotification(`🛏️ Te recuestas en la ${this.bedName}. ¡Energía y salud restauradas al 100%!`, 3.5);
    }
    return {
      success: true,
      message: 'Has descansado plácidamente.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.canInteract(initiator)) {
      return `🛏️ [E] Descansar en ${this.bedName}`;
    }
    return '';
  }

  public override update(_dt: number): void {
    // Estático
  }

  public override render(_ctx: CanvasRenderingContext2D, _camera: Camera): void {
    // Gráficos integrados en el mapa
  }
}
