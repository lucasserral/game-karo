import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Sprite } from '../graphics/Sprite.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

export type DoorOrientation = 'horizontal' | 'vertical';

/**
 * Door: Puerta o verja con cerrojo que bloquea el paso hasta que el jugador
 * interactúa teniendo la llave correspondiente.
 * Soporta orientación horizontal y vertical con diseños adaptados para el mapa.
 */
export class Door extends GameObject implements ICollidable, IInteractive {
  public isUnlocked = false;
  public readonly requiredKeyId: string;
  public readonly doorName: string;
  public orientation: DoorOrientation;
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
    doorName = 'Puerta',
    orientation?: DoorOrientation
  ) {
    super(x, y, width, height, 6);
    this.closedSprite = closedSprite;
    this.openSprite = openSprite;
    this.requiredKeyId = requiredKeyId;
    this.doorName = doorName;
    // Si no se especifica, auto-detecta: si height > width es vertical, de lo contrario horizontal
    this.orientation = orientation ?? (height > width ? 'vertical' : 'horizontal');
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

    if (initiator.hasKey(this.requiredKeyId)) {
      // Las llaves especiales de la aventura (key_1 a key_5) permanecen en el inventario como logros
      if (!this.requiredKeyId.startsWith('key_')) {
        initiator.consumeKey(this.requiredKeyId);
      }
      this.isUnlocked = true;
      initiator.setNotification(`🔓 ¡${this.doorName} desbloqueada y abierta!`, 3.5);
      return {
        success: true,
        message: `¡Has usado la llave para abrir la ${this.doorName}!`,
        consumedItem: this.requiredKeyId,
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

    if (initiator instanceof Player && initiator.hasKey(this.requiredKeyId)) {
      return `🔓 [E] Abrir ${this.doorName} con Llave`;
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

    // Dibujo procedural estilizado de la puerta según orientación
    ctx.save();
    if (this.orientation === 'vertical') {
      this.renderVerticalDoor(ctx, x, y, w, h);
    } else {
      this.renderHorizontalDoor(ctx, x, y, w, h);
    }
    ctx.restore();
  }

  private renderVerticalDoor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    if (!this.isUnlocked) {
      // 1. Sombra exterior hacia la derecha/suelo
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(x + w, y + 3, 3, h - 3);

      // 2. Marco exterior oscuro de madera maciza (jambas verticales y dinteles)
      ctx.fillStyle = '#3e1f0d';
      ctx.fillRect(x, y, w, h);

      // 3. Hoja de la puerta (madera cálida de roble/caoba)
      ctx.fillStyle = '#784323';
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

      // Bisel de luz superior e izquierdo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.fillRect(x + 2, y + 2, w - 4, 1.5);
      ctx.fillRect(x + 2, y + 2, 1.5, h - 4);

      // 4. Tablones horizontales (ranuras divisorias que dan el aspecto vertical)
      const numPlanks = 4;
      const stepY = (h - 4) / numPlanks;
      for (let i = 1; i < numPlanks; i++) {
        const lineY = Math.floor(y + 2 + i * stepY);
        ctx.fillStyle = '#452613';
        ctx.fillRect(x + 2, lineY, w - 4, 1.5);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + 2, lineY + 1.5, w - 4, 1);
      }

      // 5. Herrajes y bisagras de hierro forjado negro en el lateral izquierdo
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 1, y + 6, 4, 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 2, y + 7, 2, 2);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 1, y + h - 10, 4, 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 2, y + h - 9, 2, 2);

      // 6. Picaporte y cerradura dorada en el lateral derecho
      const midY = y + Math.floor(h / 2);
      const knobX = x + w - 5;

      // Placa de cerradura dorada
      ctx.fillStyle = '#b45309';
      ctx.fillRect(knobX - 2, midY - 6, 4, 12);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(knobX - 1.5, midY - 5, 3, 10);

      // Pomo redondo dorado brillante
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(knobX, midY - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Cerradura / bocallave oscura
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(knobX - 1, midY + 1.5, 2, 2.5);
    } else {
      // Puerta abierta:
      // 1. Umbral / paso despejado con sombra suave
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.fillRect(x, y, w, h);

      // 2. Dintel y umbral
      ctx.fillStyle = '#3e1f0d';
      ctx.fillRect(x, y, w, 2);
      ctx.fillRect(x, y + h - 2, w, 2);

      // 3. Hoja de la puerta abierta replegada contra la pared izquierda
      ctx.fillStyle = '#5c3218';
      ctx.fillRect(x, y + 2, 3, h - 4);
      ctx.fillStyle = '#784323';
      ctx.fillRect(x + 1, y + 3, 2, h - 6);

      // Bisagras vistas
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y + 5, 2, 3);
      ctx.fillRect(x, y + h - 8, 2, 3);
    }
  }

  private renderHorizontalDoor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    if (!this.isUnlocked) {
      // Puerta cerrada: marco y tablones de madera
      ctx.fillStyle = '#452613';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#784323';
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

      // Bisel de luz superior
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(x + 2, y + 2, w - 4, 1.5);

      // Tablones verticales
      const numPlanks = Math.max(2, Math.floor(w / 16));
      const stepX = (w - 4) / numPlanks;
      ctx.fillStyle = '#5c3218';
      for (let i = 1; i < numPlanks; i++) {
        ctx.fillRect(Math.floor(x + 2 + i * stepX), y + 2, 1.5, h - 4);
      }

      // Herrajes de hierro en los extremos
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 2, y + 3, 5, 3);
      ctx.fillRect(x + 2, y + h - 6, 5, 3);

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
  }
}
