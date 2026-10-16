import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Sprite } from '../graphics/Sprite.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

/**
 * Door demonstrates both passive actions (solid obstacle when closed)
 * and active actions (unlocks and opens when interacted with the matching key).
 */
export class Door extends GameObject implements ICollidable, IInteractive {
  public isUnlocked = false;
  public readonly requiredKeyId: string;
  public readonly interactionRadius = 48; // Interaction trigger distance in pixels

  private closedSprite: Sprite;
  private openSprite: Sprite;

  constructor(
    x: number,
    y: number,
    closedSprite: Sprite,
    openSprite: Sprite,
    requiredKeyId = 'golden_key',
    width = 32,
    height = 32
  ) {
    super(x, y, width, height, 6);
    this.closedSprite = closedSprite;
    this.openSprite = openSprite;
    this.requiredKeyId = requiredKeyId;
  }

  // --- ICollidable (Passive action) ---
  public isSolid(): boolean {
    // Only solid (blocks player) if not yet unlocked/opened
    return !this.isUnlocked;
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  // --- IInteractive (Active action) ---
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

    if (initiator.hasKey(this.requiredKeyId)) {
      initiator.consumeKey(this.requiredKeyId);
      this.isUnlocked = true;
      initiator.setNotification('¡Puerta desbloqueada y abierta!');
      return {
        success: true,
        message: '¡Has usado la llave para abrir la puerta!',
        consumedItem: this.requiredKeyId,
      };
    }

    initiator.setNotification('Está cerrada con llave. ¡Búscala en el mapa!');
    return {
      success: false,
      message: 'Necesitas una llave para abrir esta puerta.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.isUnlocked) {
      return '';
    }

    if (initiator instanceof Player && initiator.hasKey(this.requiredKeyId)) {
      return '[E] Abrir puerta con Llave';
    }

    return '🔒 Puerta cerrada (Requiere Llave)';
  }

  public override update(_dt: number): void {
    // State is driven by interactions
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);
    const sprite = this.isUnlocked ? this.openSprite : this.closedSprite;

    sprite.draw(ctx, x, y, this.size.x, this.size.y);
  }
}
