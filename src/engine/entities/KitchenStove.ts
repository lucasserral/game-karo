import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

interface SteamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
}

/**
 * KitchenStove: Fogón gourmet en la cocina de la mansión con una olla burbujeante.
 * Emite vapor animado e interactúa permitiendo probar una sopa caliente.
 */
export class KitchenStove extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 60;
  private steam: SteamParticle[] = [];
  private animTime = 0;

  constructor(x = 645, y = 30, width = 60, height = 45) {
    super(x, y, width, height, 7);
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
      initiator.setNotification('🍲 ¡Pruebas la sopa de hierbas silvestres! Deliciosa y reconfortante (+Stamina).', 3.5);
    }
    return {
      success: true,
      message: 'Has probado la sopa caliente recién hecha.',
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.canInteract(initiator)) {
      return '🍲 [E] Probar la sopa caliente en el fogón';
    }
    return '';
  }

  public override update(dt: number): void {
    this.animTime += dt;

    if (Math.random() < 0.45) {
      const sx = this.position.x + this.size.x * 0.5 + (Math.random() - 0.5) * 8;
      const sy = this.position.y + this.size.y * 0.4;
      this.steam.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 6,
        vy: -15 - Math.random() * 12,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.5,
        radius: 2 + Math.random() * 2,
      });
    }

    for (const p of this.steam) {
      p.life += dt;
      p.x += p.vx * dt + Math.sin(p.life * 5) * 0.5;
      p.y += p.vy * dt;
      p.radius += 1.8 * dt; // El vapor se expande
    }
    this.steam = this.steam.filter((p) => p.life < p.maxLife);
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    ctx.save();
    for (const p of this.steam) {
      const alpha = Math.max(0, (1 - p.life / p.maxLife) * 0.45);
      ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
