import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

/**
 * BookshelfEntity: Estantería interactiva de libros antiguos y manuscritos botánicos.
 * Permite al jugador leer crónicas sobre la finca y pistas sobre llaves ocultas.
 */
export class BookshelfEntity extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 55;
  public readonly loreText: string;
  public readonly bookTitle: string;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    bookTitle = 'Crónicas de Karo',
    loreText = 'Un manuscrito encuadernado en cuero narra la construcción del laberinto de setos y la fuente sagrada.'
  ) {
    super(x, y, width, height, 6);
    this.bookTitle = bookTitle;
    this.loreText = loreText;
  }

  public isSolid(): boolean {
    return true;
  }

  public getCollider(): BoundingBox {
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  public canInteract(initiator: GameObject): boolean {
    const dist = this.getCenter().distanceTo(initiator.getCenter());
    return dist <= this.interactionRadius;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (initiator instanceof Player) {
      initiator.setNotification(`📖 ${this.bookTitle}: "${this.loreText}"`, 4);
    }
    return {
      success: true,
      message: `${this.bookTitle}: ${this.loreText}`,
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.canInteract(initiator)) {
      return `📖 [E] Leer "${this.bookTitle}"`;
    }
    return '';
  }

  public override update(_dt: number): void {
    // Estático
  }

  public override render(_ctx: CanvasRenderingContext2D, _camera: Camera): void {
    // La estantería ya está pintada en el fondo del mapa, esta entidad añade la colisión e interactividad
  }
}
