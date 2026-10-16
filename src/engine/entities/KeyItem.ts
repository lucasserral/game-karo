import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Sprite } from '../graphics/Sprite.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

/**
 * Collectible key entity with gentle floating animation.
 * Can be picked up upon touch or through direct interaction.
 */
export class KeyItem extends GameObject implements ICollidable, IInteractive {
  public readonly keyId: string;
  public readonly keyName: string;
  public readonly interactionRadius = 36;

  private sprite: Sprite;
  private animTimer = 0;

  constructor(
    x: number,
    y: number,
    sprite: Sprite,
    keyId = 'golden_key',
    keyName = 'Llave Dorada',
    width = 32,
    height = 32
  ) {
    super(x, y, width, height, 7);
    this.sprite = sprite;
    this.keyId = keyId;
    this.keyName = keyName;
  }

  // --- ICollidable (Passive collision trigger) ---
  public isSolid(): boolean {
    // Non-blocking trigger volume
    return false;
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(this.position.x + 4, this.position.y + 4, this.size.x - 8, this.size.y - 8);
  }

  public onCollision(other: GameObject): void {
    if (this.isDestroyed) {
      return;
    }
    if (other instanceof Player) {
      this.collect(other);
    }
  }

  // --- IInteractive (Active interaction) ---
  public canInteract(initiator: GameObject): boolean {
    if (this.isDestroyed) {
      return false;
    }
    return this.getCenter().distanceTo(initiator.getCenter()) <= this.interactionRadius;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (this.isDestroyed) {
      return { success: false };
    }
    if (initiator instanceof Player) {
      this.collect(initiator);
      return {
        success: true,
        message: `¡Has recogido la ${this.keyName}!`,
      };
    }
    return { success: false };
  }

  public getInteractionPrompt(_initiator: GameObject): string {
    return `[E] Recoger ${this.keyName}`;
  }

  private collect(player: Player): void {
    player.addKey(this.keyId);
    this.destroy();
  }

  public override update(dt: number): void {
    this.animTimer += dt;
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    if (this.isDestroyed) {
      return;
    }

    const x = Math.floor(this.position.x);
    // Vertical floating bounce
    const bobOffset = Math.sin(this.animTimer * 5) * 3;
    const y = Math.floor(this.position.y + bobOffset);

    // Subtle golden glow circle behind key
    ctx.save();
    ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.beginPath();
    ctx.arc(x + 16, y + 16, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.sprite.draw(ctx, x, y, this.size.x, this.size.y);
  }
}
