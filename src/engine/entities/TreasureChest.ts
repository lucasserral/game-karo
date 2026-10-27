import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

/**
 * TreasureChest: Cofre de roble con herrajes de latón oculto en el jardín secreto.
 * Requiere una llave para abrirse y recompensa al explorador con el Tesoro de Karo.
 */
export class TreasureChest extends GameObject implements ICollidable, IInteractive {
  public isOpen = false;
  public readonly requiredKeyId: string;
  public readonly interactionRadius = 50;

  constructor(x = 880, y = 70, requiredKeyId = 'iron_key', width = 36, height = 30) {
    super(x, y, width, height, 8);
    this.requiredKeyId = requiredKeyId;
  }

  public isSolid(): boolean {
    return true;
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  public canInteract(initiator: GameObject): boolean {
    if (this.isOpen) return false;
    const dist = this.getCenter().distanceTo(initiator.getCenter());
    return dist <= this.interactionRadius;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (this.isOpen) {
      return { success: false, message: 'El cofre ya ha sido abierto.' };
    }

    if (!(initiator instanceof Player)) {
      return { success: false, message: 'Solo el jugador puede abrir el cofre.' };
    }

    if (initiator.hasKey(this.requiredKeyId)) {
      initiator.consumeKey(this.requiredKeyId);
      this.isOpen = true;
      initiator.setNotification('🎉 ¡Cofre abierto! Has encontrado el Amuleto de Esmeralda y 500 monedas de oro.', 5);
      return {
        success: true,
        message: '¡Has abierto el cofre del tesoro!',
        consumedItem: this.requiredKeyId,
      };
    }

    initiator.setNotification('🔒 El cofre está cerrado con un candado de hierro pesado. ¡Busca la Llave de Hierro!', 3.5);
    return {
      success: false,
      message: 'Necesitas la Llave de Hierro para abrir este cofre.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.isOpen) {
      return '';
    }
    if (initiator instanceof Player && initiator.hasKey(this.requiredKeyId)) {
      return '💎 [E] Abrir Cofre con Llave de Hierro';
    }
    return '🔒 Cofre Cerrado (Requiere Llave de Hierro)';
  }

  public override update(_dt: number): void {}

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);
    const w = this.size.x;
    const h = this.size.y;

    ctx.save();

    // Sombra del cofre en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 2, w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Caja de madera oscura
    ctx.fillStyle = '#5c391a';
    ctx.fillRect(x + 2, y + 8, w - 4, h - 10);
    ctx.fillStyle = '#784e27';
    ctx.fillRect(x + 4, y + 9, w - 8, h - 12);

    if (!this.isOpen) {
      // Tapa redondeada cerrada
      ctx.fillStyle = '#8f5c2c';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + 10, w / 2 - 2, 6, 0, Math.PI, 0);
      ctx.fill();

      // Bandas doradas de refuerzo
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x + 6, y + 4, 3, h - 6);
      ctx.fillRect(x + w - 9, y + 4, 3, h - 6);

      // Cerradura dorada
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x + w / 2 - 3, y + 12, 6, 6);
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(x + w / 2 - 1, y + 14, 2, 3);
    } else {
      // Tapa abierta hacia atrás
      ctx.fillStyle = '#452613';
      ctx.fillRect(x + 4, y + 4, w - 8, 8); // interior oscuro

      // Resplandor dorado de joyas y oro en el interior
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x + 6, y + 8, w - 12, 4);
      ctx.fillStyle = '#34d399'; // Esmeralda
      ctx.fillRect(x + 10, y + 7, 3, 3);
      ctx.fillStyle = '#f43f5e'; // Rubí
      ctx.fillRect(x + 18, y + 7, 3, 3);
    }

    ctx.restore();
  }
}
