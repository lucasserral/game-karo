import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

/**
 * Fireplace: Chimenea de piedra con hogar crepitante y leña ardiendo.
 * Cuenta con animación de llamas pixel-art multicapa, resplandor cálido de luz pulsante,
 * emisión de chispas/brasas hacia la campana de tiro e interacción reconfortante.
 */
export class Fireplace extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 60;
  private animTime = 0;
  private embers: Ember[] = [];

  constructor(x: number, y: number, width = 50, height = 45) {
    super(x, y, width, height, 7); // zIndex 7
  }

  // --- ICollidable ---
  public isSolid(): boolean {
    return true;
  }

  public getCollider(): BoundingBox {
    // La estructura de piedra de la chimenea es sólida
    return new BoundingBox(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  // --- IInteractive ---
  public canInteract(initiator: GameObject): boolean {
    const dist = this.getCenter().distanceTo(initiator.getCenter());
    return dist <= this.interactionRadius;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (!(initiator instanceof Player)) {
      return { success: false, message: 'Solo el jugador puede interactuar.' };
    }

    const messages = [
      '🔥 Te calientas las manos junto al fuego crepitante. ¡Qué reconfortante!',
      '🪵 La madera de roble desprende un aroma acogedor y cálido.',
      '✨ El calor del fuego disipa el cansancio de tu viaje (+Energía).',
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    initiator.setNotification(msg, 3);

    return {
      success: true,
      message: msg,
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.canInteract(initiator)) {
      return '🔥 [E] Calentarse junto al fuego';
    }
    return '';
  }

  public override update(dt: number): void {
    this.animTime += dt;

    // Emisión periódica de chispas / ascuas
    if (Math.random() < 0.4) {
      const hx = this.position.x + this.size.x * 0.5 + (Math.random() - 0.5) * 16;
      const hy = this.position.y + this.size.y * 0.75;
      this.embers.push({
        x: hx,
        y: hy,
        vx: (Math.random() - 0.5) * 14,
        vy: -20 - Math.random() * 25,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5,
        size: 1 + Math.random() * 1.5,
        color: Math.random() > 0.4 ? '#fef08a' : '#f97316',
      });
    }

    for (const e of this.embers) {
      e.life += dt;
      e.x += e.vx * dt + Math.sin(e.life * 8) * 0.4;
      e.y += e.vy * dt;
    }
    this.embers = this.embers.filter((e) => e.life < e.maxLife);
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const hx = Math.floor(this.position.x + this.size.x * 0.5);
    const hy = Math.floor(this.position.y + this.size.y * 0.7);

    ctx.save();

    // 1. Resplandor cálido ambiental (Luz radial pulsante)
    const flicker = Math.sin(this.animTime * 12) * 0.08 + Math.cos(this.animTime * 19) * 0.05;
    const glowRadius = 55 + flicker * 25;
    const glow = ctx.createRadialGradient(hx, hy, 4, hx, hy, glowRadius);
    glow.addColorStop(0, `rgba(251, 146, 60, ${0.45 + flicker * 0.2})`);
    glow.addColorStop(0.5, `rgba(245, 158, 11, ${0.2 + flicker * 0.1})`);
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Base de ascuas al rojo vivo
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(hx - 10, hy + 2, 20, 4);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(hx - 8, hy + 1, 16, 3);

    // 3. Llamas animadas multicapa
    const t = this.animTime * 14;
    const flameOffsets = [-6, -2, 2, 6];

    // Capa exterior naranja
    ctx.fillStyle = '#f97316';
    for (let i = 0; i < flameOffsets.length; i++) {
      const ox = flameOffsets[i];
      const h = 7 + Math.sin(t + i * 1.7) * 3.5 + Math.cos(t * 1.3 + i) * 2;
      const w = 4;
      ctx.beginPath();
      ctx.moveTo(hx + ox - w / 2, hy + 2);
      ctx.lineTo(hx + ox, hy + 2 - h);
      ctx.lineTo(hx + ox + w / 2, hy + 2);
      ctx.closePath();
      ctx.fill();
    }

    // Capa interior amarilla brillante
    ctx.fillStyle = '#fde047';
    for (let i = 0; i < flameOffsets.length - 1; i++) {
      const ox = (flameOffsets[i] + flameOffsets[i + 1]) / 2;
      const h = 5 + Math.sin(t * 1.2 + i * 2.1) * 2.5;
      const w = 3;
      ctx.beginPath();
      ctx.moveTo(hx + ox - w / 2, hy + 1);
      ctx.lineTo(hx + ox, hy + 1 - h);
      ctx.lineTo(hx + ox + w / 2, hy + 1);
      ctx.closePath();
      ctx.fill();
    }

    // Núcleo blanco incandescente
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hx, hy, 2 + Math.sin(t * 2) * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // 4. Renderizar ascuas y chispas
    for (const e of this.embers) {
      const alpha = Math.max(0, 1 - e.life / e.maxLife);
      ctx.fillStyle = e.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(e.x, e.y, e.size, e.size);
    }

    ctx.restore();
  }
}
