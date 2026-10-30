import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';
import { MinigameManager } from '../minigames/MinigameManager.ts';

/**
 * PhotoTable: Mesa en (240, 740) donde descansa la nota misteriosa y el rompecabezas de la foto.
 */
export class PhotoTable extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 55;

  constructor(x = 240, y = 740, width = 52, height = 36) {
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
    if (!(initiator instanceof Player)) {
      return { success: false, message: 'Solo el jugador puede interactuar con la mesa.' };
    }

    const manager = MinigameManager.getInstance();
    manager.openMinigame('photo_puzzle', initiator);

    const minigame = manager.getMinigame('photo_puzzle');
    if (minigame?.isComplete()) {
      initiator.setNotification('🖼️ La foto está completa en la mesa. Llave key_1 en tu inventario.', 3.5);
      return {
        success: true,
        message: 'Foto completada.',
      };
    }

    if (initiator.hasAllPhotoFragments()) {
      initiator.setNotification('✨ ¡Has unido los 4 fragmentos en la mesa y recibido la llave key_1!', 4.5);
      return {
        success: true,
        message: 'Has ensamblado la foto y obtenido key_1.',
      };
    }

    initiator.setNotification('📝 Has examinado la nota sobre la mesa.', 3.0);
    return {
      success: true,
      message: 'Nota abierta en el panel lateral.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (initiator instanceof Player) {
      const manager = MinigameManager.getInstance();
      const minigame = manager.getMinigame('photo_puzzle');

      if (minigame?.isComplete()) {
        return '🖼️ [E] Ver foto en la mesa';
      }
      if (initiator.hasAllPhotoFragments()) {
        return '✨ [E] Completar foto en la mesa';
      }
      return '📝 [E] Leer nota en la mesa';
    }
    return '[E] Interactuar con la mesa';
  }

  public override update(_dt: number): void {}

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    // Dibujar un pequeño papel/pergamino brillante sobre la mesa para indicar interactividad
    const x = Math.floor(this.position.x + this.size.x / 2 - 8);
    const y = Math.floor(this.position.y + this.size.y / 2 - 6);

    ctx.save();
    // Sombra del papel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + 1, y + 1, 16, 12);

    // Hoja de papel miniatura
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x, y, 16, 12);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 15, 11);

    // Líneas de texto miniatura
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 3, y + 3, 10, 1.5);
    ctx.fillRect(x + 3, y + 6, 8, 1.5);

    // Chincheta roja
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 8, y + 1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
