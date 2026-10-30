import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';
import { MinigameManager } from '../minigames/MinigameManager.ts';

/**
 * QuizPaperEntity: Papel/carta con formulario de preguntas en la mesa de coordenadas (415, 145).
 */
export class QuizPaperEntity extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 48;
  private animTimer = 0;

  constructor(x = 415, y = 145, width = 38, height = 28) {
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
      return { success: false, message: 'Solo el jugador puede leer la nota.' };
    }

    const manager = MinigameManager.getInstance();
    manager.openMinigame('quiz_minigame', initiator);

    const quiz = manager.getMinigame('quiz_minigame');
    if (quiz?.isComplete() || initiator.hasKey('key_3')) {
      initiator.setNotification('❤️ Carta de recuerdos completada. Llave key_3 en tu inventario.', 3.0);
    } else {
      initiator.setNotification('💌 Has abierto la nota con preguntas sobre la mesa.', 2.5);
    }

    return {
      success: true,
      message: 'Cuestionario abierto.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (initiator instanceof Player) {
      const manager = MinigameManager.getInstance();
      const quiz = manager.getMinigame('quiz_minigame');
      if (quiz?.isComplete() || initiator.hasKey('key_3')) {
        return '💌 [E] Ver nota de recuerdos';
      }
    }
    return '💌 [E] Leer nota con preguntas';
  }

  public override update(dt: number): void {
    this.animTimer += dt;
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);

    ctx.save();

    // 1. Sombra sutil del papel sobre la mesa
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(x + 2, y + 2, 20, 16);

    // 2. Hoja de papel blanco marfil
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(x, y, 20, 16);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 19, 15);

    // Líneas de texto manuscrito decorativo
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(x + 3, y + 4, 14, 1.2);
    ctx.fillRect(x + 3, y + 7, 11, 1.2);
    ctx.fillRect(x + 3, y + 10, 13, 1.2);

    // 3. Sello de corazón rosa/rojo
    const pulse = (Math.sin(this.animTimer * 4) + 1) / 2;
    ctx.fillStyle = pulse > 0.5 ? '#f43f5e' : '#e11d48';
    ctx.beginPath();
    ctx.arc(x + 15, y + 12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
