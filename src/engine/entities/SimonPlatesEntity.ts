import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';
import { MinigameManager } from '../minigames/MinigameManager.ts';

/**
 * SimonPlatesEntity: Alacena con platos de colores interactivos en las coordenadas (80, 400).
 */
export class SimonPlatesEntity extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 50;
  private animTimer = 0;

  constructor(x = 80, y = 400, width = 44, height = 34) {
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
      return { success: false, message: 'Solo el jugador puede interactuar con los platos.' };
    }

    const manager = MinigameManager.getInstance();
    manager.openMinigame('simon_plates', initiator);

    const simon = manager.getMinigame('simon_plates');
    if (simon?.isComplete() || initiator.hasKey('key_5')) {
      initiator.setNotification('🍽️ Secuencia de platos superada. Llave key_5 en tu inventario.', 3.0);
    } else {
      initiator.setNotification('🍽️ Has examinado la alacena con platos de colores.', 2.5);
    }

    return {
      success: true,
      message: 'Juego de secuencia de platos iniciado.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (initiator instanceof Player) {
      const manager = MinigameManager.getInstance();
      const simon = manager.getMinigame('simon_plates');
      if (simon?.isComplete() || initiator.hasKey('key_5')) {
        return '🍽️ [E] Ver alacena de platos';
      }
    }
    return '🍽️ [E] Examinar platos de colores';
  }

  public override update(dt: number): void {
    this.animTimer += dt;
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);

    ctx.save();

    // 1. Sombra bajo la alacena
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 22, y + 28, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Mueble de madera noble/alacena
    ctx.fillStyle = '#5c2b0c'; // madera caoba
    ctx.beginPath();
    ctx.roundRect(x, y + 6, 44, 24, 3);
    ctx.fill();
    ctx.strokeStyle = '#381604';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Estante interior
    ctx.fillStyle = '#7c3a10';
    ctx.fillRect(x + 3, y + 9, 38, 18);

    // 3. 4 platos de cerámica en exhibición vertical (Rojo, Azul, Verde, Amarillo)
    const plateColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
    const plateRadius = 4;

    plateColors.forEach((color, idx) => {
      const px = x + 7 + idx * 10;
      const py = y + 18;

      // Plato exterior con borde dorado
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(px, py, plateRadius + 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Centro esmaltado de color
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, plateRadius, 0, Math.PI * 2);
      ctx.fill();

      // Brillo cerámico
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(px - 1, py - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Destello místico ocasional
    const pulse = (Math.sin(this.animTimer * 3.5) + 1) / 2;
    if (pulse > 0.65) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.beginPath();
      ctx.arc(x + 22, y + 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
