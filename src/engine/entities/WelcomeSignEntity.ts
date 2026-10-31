import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';
import { MinigameManager } from '../minigames/MinigameManager.ts';

/**
 * WelcomeSignEntity: Cartel y nota interactiva situado en la entrada al lado del jugador (340, 945).
 * Explica las instrucciones del juego, el objetivo principal (encontrar a Karolina) y la pista
 * de que la primera llave para abrir las puertas de la mansión se consigue pescando en el lago.
 */
export class WelcomeSignEntity extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 58;
  private animTimer = 0;

  constructor(x = 340, y = 945, width = 36, height = 38) {
    super(x, y, width, height, 7);
  }

  public isSolid(): boolean {
    return true;
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(this.position.x + 8, this.position.y + 20, 20, 14);
  }

  public canInteract(initiator: GameObject): boolean {
    const dist = this.getCenter().distanceTo(initiator.getCenter());
    return dist <= this.interactionRadius;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (!(initiator instanceof Player)) {
      return { success: false, message: 'Solo el jugador puede leer el cartel.' };
    }

    const manager = MinigameManager.getInstance();
    manager.openMinigame('welcome_sign', initiator);
    initiator.setNotification('📜 Has abierto el cartel de la entrada: ¡Tu objetivo es encontrar a Karolina!', 3.5);

    return {
      success: true,
      message: 'Cartel de bienvenida abierto en el panel lateral.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.canInteract(initiator)) {
      return '🪧 [E] Leer Cartel de la Entrada';
    }
    return '';
  }

  public override update(dt: number): void {
    this.animTimer += dt;
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);

    ctx.save();

    // 1. Sombra ovalada en el suelo
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 35, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Postes de madera rústicos (patas del cartel)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 8, y + 16, 4, 18);
    ctx.fillRect(x + 24, y + 16, 4, 18);

    // Borde de sombra de los postes
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 10, y + 16, 2, 18);
    ctx.fillRect(x + 26, y + 16, 2, 18);

    // 3. Tablón de madera principal (fondo del cartel)
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, 32, 22, 3);
    ctx.fill();

    // Borde biselado de madera
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Pergamino / Nota de papel clavada en el tablón
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 5, 26, 16, 2);
    ctx.fill();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Tachuelas / clavos metálicos dorados en las esquinas superiores
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(x + 7, y + 7, 1.2, 0, Math.PI * 2);
    ctx.arc(x + 29, y + 7, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Líneas simuladas de texto manuscrito
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 8, y + 9, 14, 1.2);
    ctx.fillRect(x + 8, y + 12, 18, 1.2);
    ctx.fillRect(x + 8, y + 15, 12, 1.2);

    // Pequeño corazón / sello rojo en la esquina inferior (guiño a Karolina)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 26, y + 16, 2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Icono flotante con suave levitación (indicador de que es interactivo)
    const floatOffset = Math.sin(this.animTimer * 3.5) * 2.5;
    const glowAlpha = 0.4 + Math.sin(this.animTimer * 4) * 0.25;

    // Halo de brillo dorado
    ctx.fillStyle = `rgba(245, 158, 11, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(x + 18, y - 6 + floatOffset, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Mini círculo / burbuja con símbolo '!'
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + 18, y - 6 + floatOffset, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', x + 18, y - 5.5 + floatOffset);

    ctx.restore();
  }
}
