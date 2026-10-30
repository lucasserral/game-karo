import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';
import { MinigameManager } from '../minigames/MinigameManager.ts';

/**
 * PhotoFragmentItem: Pedacito de foto coleccionable repartido por el mapa.
 */
export class PhotoFragmentItem extends GameObject implements ICollidable, IInteractive {
  public readonly fragmentIndex: number;
  public readonly fragmentName: string;
  public readonly interactionRadius = 38;

  private animTimer = 0;

  constructor(x: number, y: number, fragmentIndex: number, width = 24, height = 24) {
    super(x, y, width, height, 7);
    this.fragmentIndex = fragmentIndex;
    this.fragmentName = `Pedacito de Foto #${fragmentIndex}`;
  }

  public isSolid(): boolean {
    return false;
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(this.position.x + 2, this.position.y + 2, this.size.x - 4, this.size.y - 4);
  }

  public onCollision(other: GameObject): void {
    if (this.isDestroyed) return;
    if (other instanceof Player) {
      this.collect(other);
    }
  }

  public canInteract(initiator: GameObject): boolean {
    if (this.isDestroyed) return false;
    return this.getCenter().distanceTo(initiator.getCenter()) <= this.interactionRadius;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (this.isDestroyed) return { success: false };
    if (initiator instanceof Player) {
      this.collect(initiator);
      return {
        success: true,
        message: `¡Recogiste el ${this.fragmentName}!`,
      };
    }
    return { success: false };
  }

  public getInteractionPrompt(_initiator: GameObject): string {
    return `[E] Recoger ${this.fragmentName}`;
  }

  private collect(player: Player): void {
    player.addPhotoFragment(this.fragmentIndex);
    this.destroy();

    // Actualizar sidebar en tiempo real si el minijuego está abierto
    const manager = MinigameManager.getInstance();
    if (manager.isMinigameActive('photo_puzzle')) {
      manager.renderActive(player);
    }
  }

  public override update(dt: number): void {
    this.animTimer += dt;
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    if (this.isDestroyed) return;

    const x = Math.floor(this.position.x);
    const bobOffset = Math.sin(this.animTimer * 4.5) * 3;
    const y = Math.floor(this.position.y + bobOffset);

    ctx.save();

    // 1. Aura de brillo suave pulsante
    const pulse = (Math.sin(this.animTimer * 3) + 1) / 2;
    const glowRadius = 10 + pulse * 4;
    const grad = ctx.createRadialGradient(x + 12, y + 12, 2, x + 12, y + 12, glowRadius);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x + 12, y + 12, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sombra en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 12, Math.floor(this.position.y + 22), 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Miniatura de pedacito de foto tipo polaroid rasgada
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;

    // Forma ligeramente rotada
    ctx.translate(x + 12, y + 12);
    ctx.rotate((Math.sin(this.animTimer * 2) * 5 * Math.PI) / 180);

    ctx.beginPath();
    ctx.roundRect(-8, -9, 16, 18, 2);
    ctx.fill();
    ctx.stroke();

    // Imagen miniatura interior
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-6, -7, 12, 10);

    // Número del fragmento
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(this.fragmentIndex), 0, -2);

    // Borde rasgado inferior (2 muescas)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-3, 6, 6, 2);

    ctx.restore();
  }
}
