import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Sprite } from '../graphics/Sprite.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

/**
 * Door: Puerta o verja con cerrojo que bloquea el paso hasta que el jugador
 * interactúa teniendo la llave correspondiente.
 */
export class Door extends GameObject implements ICollidable, IInteractive {
  public isUnlocked = false;
  public readonly requiredKeyId: string;
  public readonly doorName: string;
  public readonly interactionRadius = 52;

  private closedSprite: Sprite | null;
  private openSprite: Sprite | null;

  constructor(
    x: number,
    y: number,
    closedSprite: Sprite | null = null,
    openSprite: Sprite | null = null,
    requiredKeyId = 'golden_key',
    width = 32,
    height = 32,
    doorName = 'Puerta'
  ) {
    super(x, y, width, height, 6);
    this.closedSprite = closedSprite;
    this.openSprite = openSprite;
    this.requiredKeyId = requiredKeyId;
    this.doorName = doorName;
  }

  // --- ICollidable ---
  public isSolid(): boolean {
    return !this.isUnlocked;
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  // --- IInteractive ---
  public canInteract(initiator: GameObject): boolean {
    if (this.isUnlocked) {
      return false;
    }
    const dist = this.getCenter().distanceTo(initiator.getCenter());
    return dist <= this.interactionRadius;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (this.isUnlocked) {
      return { success: false, message: 'La puerta ya está abierta.' };
    }

    if (!(initiator instanceof Player)) {
      return { success: false, message: 'Solo el jugador puede abrir la puerta.' };
    }

    const hasRequiredKey =
      initiator.hasKey(this.requiredKeyId) ||
      (this.requiredKeyId === 'key_2' && initiator.hasKey('iron_key')) ||
      (this.requiredKeyId === 'iron_key' && initiator.hasKey('key_2'));

    if (hasRequiredKey) {
      const keyToUse = initiator.hasKey(this.requiredKeyId)
        ? this.requiredKeyId
        : initiator.hasKey('key_2')
          ? 'key_2'
          : 'iron_key';

      // Las llaves especiales de la aventura (key_1 a key_5) permanecen en el inventario como logros
      if (!keyToUse.startsWith('key_')) {
        initiator.consumeKey(keyToUse);
      }
      this.isUnlocked = true;
      initiator.setNotification(`🔓 ¡${this.doorName} desbloqueada y abierta!`, 3.5);
      return {
        success: true,
        message: `¡Has usado la llave para abrir la ${this.doorName}!`,
        consumedItem: keyToUse,
      };
    }

    initiator.setNotification(`🔒 La ${this.doorName} está cerrada con llave. ¡Búscala en la finca!`, 3.5);
    return {
      success: false,
      message: `Necesitas una llave para abrir la ${this.doorName}.`,
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.isUnlocked) {
      return '';
    }

    if (initiator instanceof Player) {
      const hasKey =
        initiator.hasKey(this.requiredKeyId) ||
        (this.requiredKeyId === 'key_2' && initiator.hasKey('iron_key')) ||
        (this.requiredKeyId === 'iron_key' && initiator.hasKey('key_2'));

      if (hasKey) {
        return `🔓 [E] Abrir ${this.doorName} con Llave`;
      }
    }

    return `🔒 ${this.doorName} cerrada (Requiere Llave)`;
  }

  public override update(_dt: number): void {}

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);
    const w = this.size.x;
    const h = this.size.y;

    if (this.closedSprite && this.openSprite) {
      const sprite = this.isUnlocked ? this.openSprite : this.closedSprite;
      sprite.draw(ctx, x, y, w, h);
      return;
    }

    // Dibujo procedural estilizado de la puerta
    ctx.save();
    if (!this.isUnlocked) {
      // Puerta cerrada: marco y tablones de madera
      ctx.fillStyle = '#452613';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#784323';
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

      // Tablones
      ctx.fillStyle = '#5c3218';
      ctx.fillRect(x + w / 2 - 1, y + 2, 2, h - 4);

      // Pomo dorado brillante
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(x + w - 6, y + h / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Cerradura
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(x + w - 7, y + h / 2 + 3, 2, 3);
    } else {
      // Puerta abierta: umbral libre con hoja entreabierta
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x, y, w, h);
      // Hoja girada hacia un lado
      ctx.fillStyle = '#784323';
      ctx.fillRect(x + 1, y + 1, 4, h - 2);
    }
    ctx.restore();
  }
}
