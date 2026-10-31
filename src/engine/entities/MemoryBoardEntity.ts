import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';
import { MinigameManager } from '../minigames/MinigameManager.ts';

/**
 * MemoryBoardEntity: Tablero con cartas boca abajo en las coordenadas (970, 370).
 */
export class MemoryBoardEntity extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 50;
  private animTimer = 0;

  constructor(x = 970, y = 370, width = 44, height = 34) {
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
      return { success: false, message: 'Solo el jugador puede jugar.' };
    }

    const manager = MinigameManager.getInstance();
    manager.openMinigame('memory_minigame', initiator);

    const memory = manager.getMinigame('memory_minigame');
    if (memory?.isComplete() || initiator.hasKey('key_4')) {
      initiator.setNotification('🃏 Tablero de memoria resuelto. Llave key_4 en tu inventario.', 3.0);
    } else {
      initiator.setNotification('🃏 Has examinado el tablero con cartas boca abajo.', 2.5);
    }

    return {
      success: true,
      message: 'Juego de memoria iniciado.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (initiator instanceof Player) {
      const manager = MinigameManager.getInstance();
      const memory = manager.getMinigame('memory_minigame');
      if (memory?.isComplete() || initiator.hasKey('key_4')) {
        return '🃏 [E] Ver tablero de memoria';
      }
    }
    return '🃏 [E] Jugar a las cartas de memoria';
  }

  public override update(dt: number): void {
    this.animTimer += dt;
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);

    ctx.save();

    // 1. Sombra del tablero
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(x + 22, y + 26, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Tablero de fieltro verde bosque con marco de caoba
    ctx.fillStyle = '#451a03'; // marco madera
    ctx.beginPath();
    ctx.roundRect(x, y + 4, 44, 26, 4);
    ctx.fill();

    ctx.fillStyle = '#065f46'; // tapete verde
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 6, 40, 22, 2);
    ctx.fill();

    // 3. Mini cartas boca abajo ordenadas en el tapete
    const cardW = 7;
    const cardH = 9;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = x + 6 + col * 11;
        const cy = y + 8 + row * 10;

        // Borde dorado
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx - 0.5, cy - 0.5, cardW + 1, cardH + 1);

        // Dorso azul oscuro / rojo vino
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(cx, cy, cardW, cardH);

        // Patrón central
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx + 2.5, cy + 3.5, 2, 2);
      }
    }

    // 4. Brillo sutil flotante
    const sparkle = (Math.sin(this.animTimer * 3) + 1) / 2;
    if (sparkle > 0.6) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.beginPath();
      ctx.arc(x + 36, y + 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
