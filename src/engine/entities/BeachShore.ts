import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

/**
 * BeachShore: Costa arenosa con olas oceánicas animadas y brisa marina.
 * Impide adentrarse en aguas profundas y proporciona una atmósfera costera relajante.
 */
export class BeachShore extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 70;
  private animTime = 0;

  constructor(x = 1460, y = 600, width = 140, height = 466) {
    super(x, y, width, height, 4); // zIndex 4 (bajo el jugador)
  }

  // --- ICollidable ---
  public isSolid(): boolean {
    return true; // Bloquea el agua profunda para no salirse de la orilla
  }

  public getCollider(): BoundingBox {
    // La parte este es agua profunda no transitable
    return new BoundingBox(this.position.x + 35, this.position.y, this.size.x - 35, this.size.y);
  }

  public canInteract(initiator: GameObject): boolean {
    const dist = this.getCenter().distanceTo(initiator.getCenter());
    return dist <= this.interactionRadius + 40;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (initiator instanceof Player) {
      initiator.setNotification('🌊 El sonido suave de las olas rompiendo en la orilla te llena de paz.', 3.5);
    }
    return {
      success: true,
      message: 'Has contemplado el mar.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.canInteract(initiator)) {
      return '🌊 [E] Contemplar el horizonte del mar';
    }
    return '';
  }

  public override update(dt: number): void {
    this.animTime += dt;
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);
    const h = this.size.y;

    ctx.save();

    // 1. Olas suaves y espuma blanca rompiendo en la arena
    const numWaves = 4;
    for (let i = 0; i < numWaves; i++) {
      const waveOffset = (this.animTime * 0.4 + i / numWaves) % 1;
      const waveX = x + 10 + Math.sin(waveOffset * Math.PI) * 16;
      const alpha = Math.sin(waveOffset * Math.PI) * 0.55;

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      for (let wy = 0; wy <= h; wy += 20) {
        const curve = Math.sin((wy + this.animTime * 30) * 0.05) * 6;
        if (wy === 0) {
          ctx.moveTo(waveX + curve, y + wy);
        } else {
          ctx.lineTo(waveX + curve, y + wy);
        }
      }
      ctx.stroke();

      // Espuma brillante en el borde
      ctx.fillStyle = `rgba(224, 242, 254, ${alpha * 0.7})`;
      for (let wy = 10; wy < h; wy += 40) {
        const curve = Math.sin((wy + this.animTime * 30) * 0.05) * 6;
        ctx.beginPath();
        ctx.arc(waveX + curve - 2, y + wy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
