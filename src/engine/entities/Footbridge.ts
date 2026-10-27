import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { Camera } from '../core/Camera.ts';

/**
 * Footbridge: Puente de madera arqueado que cruza el estanque de nenúfares.
 * Proporciona un paso transitable para el jugador con barandillas colisionables
 * y renderizado de la barandilla frontal en primer plano (foreground / zIndex 25).
 */
export class Footbridge extends GameObject implements ICollidable {
  // Barandilla superior e inferior para evitar caer al agua
  private northRailingCollider: BoundingBox;
  private southRailingCollider: BoundingBox;

  constructor(x = 1225, y = 300, width = 135, height = 75) {
    super(x, y, width, height, 25); // zIndex 25 (sobre el jugador para la barandilla frontal)

    this.northRailingCollider = new BoundingBox(x, y, width, 18);
    this.southRailingCollider = new BoundingBox(x, y + height - 18, width, 18);
  }

  // --- ICollidable ---
  public isSolid(): boolean {
    return true;
  }

  public getCollider(): BoundingBox {
    // Por defecto devuelve la barandilla norte; la sur se chequea mediante colisión secundaria
    return this.northRailingCollider;
  }

  public getSouthCollider(): BoundingBox {
    return this.southRailingCollider;
  }

  public override update(_dt: number): void {
    // Estático
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    // Dibuja la barandilla frontal de madera con postes y arco ornamental sobre las piernas del jugador
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);
    const w = this.size.x;
    const h = this.size.y;

    ctx.save();

    // Barandilla frontal (borde sur del puente)
    const ry = y + h - 14;

    // Pasamanos curvado
    ctx.strokeStyle = '#5a381e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 5, ry + 2);
    ctx.quadraticCurveTo(x + w / 2, ry - 3, x + w - 5, ry + 2);
    ctx.stroke();

    ctx.strokeStyle = '#a47148';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, ry + 1);
    ctx.quadraticCurveTo(x + w / 2, ry - 4, x + w - 5, ry + 1);
    ctx.stroke();

    // Postes verticales de madera
    const posts = [x + 8, x + w * 0.33, x + w * 0.66, x + w - 8];
    for (const px of posts) {
      // Poste
      ctx.fillStyle = '#6b4224';
      ctx.fillRect(px - 3, ry - 3, 6, 12);
      ctx.fillStyle = '#b88255';
      ctx.fillRect(px - 2, ry - 3, 2, 12); // brillo

      // Remate esférico del poste
      ctx.fillStyle = '#d49b6a';
      ctx.beginPath();
      ctx.arc(px, ry - 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#452613';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}
