import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';
import { MinigameManager } from '../minigames/MinigameManager.ts';

/**
 * FishingRodEntity: Caña de pescar apoyada en el muelle en (1272, 343).
 * Al interactuar, abre el minijuego de pesca en el panel lateral.
 */
export class FishingRodEntity extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 48;
  private animTimer = 0;

  constructor(x = 1272, y = 343, width = 32, height = 32) {
    super(x, y, width, height, 7);
  }

  public isSolid(): boolean {
    return false;
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
      return { success: false, message: 'Solo el jugador puede pescar.' };
    }

    MinigameManager.getInstance().openMinigame('fishing_minigame', initiator);
    initiator.setNotification('🎣 Te preparas para pescar en el muelle...', 2.5);

    return {
      success: true,
      message: 'Minijuego de pesca iniciado.',
    };
  }

  public getInteractionPrompt(_initiator: GameObject): string {
    return '🎣 [E] Pescar en el muelle';
  }

  public override update(dt: number): void {
    this.animTimer += dt;
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);

    ctx.save();

    // 1. Caña de bambú apoyada en diagonal
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 26);
    ctx.quadraticCurveTo(x + 14, y + 10, x + 24, y + 2);
    ctx.stroke();

    // Mango de corcho y carrete
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 26);
    ctx.lineTo(x + 9, y + 21);
    ctx.stroke();

    // Carrete plateado
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(x + 9, y + 20, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sedal fino cayendo hacia el agua
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 2);

    const bobY = Math.sin(this.animTimer * 4) * 2;
    const bobberX = x + 30;
    const bobberY = y + 18 + bobY;

    ctx.quadraticCurveTo(x + 28, y + 8, bobberX, bobberY);
    ctx.stroke();

    // 3. Mini boya flotando en el agua al lado del muelle
    // Mitad roja
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bobberX, bobberY, 2.5, Math.PI, 0);
    ctx.fill();

    // Mitad blanca
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bobberX, bobberY, 2.5, 0, Math.PI);
    ctx.fill();

    // Pequeño aro de onda en el agua
    const rippleRadius = 3 + (Math.sin(this.animTimer * 3) + 1) * 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(bobberX, bobberY + 2, rippleRadius, rippleRadius * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
