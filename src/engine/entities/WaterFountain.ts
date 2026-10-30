import { GameObject } from '../core/GameObject.ts';
import { BoundingBox } from '../math/BoundingBox.ts';
import type { ICollidable } from '../core/ICollidable.ts';
import type { IInteractive, InteractionResult } from '../core/IInteractive.ts';
import type { Camera } from '../core/Camera.ts';
import { Player } from './Player.ts';

interface FountainParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

/**
 * WaterFountain: Fuente ornamental de piedra labrada ubicada en el centro del jardín de setos.
 * Cuenta con animación dinámica de ondas en el agua, gotas de agua burbujeantes
 * y una interacción para lanzar monedas y pedir un deseo.
 */
export class WaterFountain extends GameObject implements ICollidable, IInteractive {
  public readonly interactionRadius = 75;
  private animTime = 0;
  private particles: FountainParticle[] = [];
  private wishesCount = 0;

  constructor(x = 640, y = 490, width = 110, height = 110) {
    // x, y es el centro de la fuente en el mapa
    super(x - width / 2, y - height / 2, width, height, 8); // zIndex 8
    this.colliderShape = 'oval';
  }

  // --- ICollidable ---
  public isSolid(): boolean {
    return true;
  }

  public getCollider(): BoundingBox {
    // El núcleo sólido de piedra de la fuente en la base
    const cx = this.position.x + this.size.x / 2;
    const cy = this.position.y + this.size.y / 2;
    const rx = this.size.x * 0.38;
    const ry = this.size.y * 0.28;
    return new BoundingBox(cx - rx, cy - ry, rx * 2, ry * 2);
  }

  // --- IInteractive ---
  public canInteract(initiator: GameObject): boolean {
    const dist = this.getCenter().distanceTo(initiator.getCenter());
    return dist <= this.interactionRadius;
  }

  public interact(initiator: GameObject): InteractionResult {
    if (!(initiator instanceof Player)) {
      return { success: false, message: 'Solo el jugador puede pedir un deseo.' };
    }

    this.wishesCount++;

    // Generar una explosión de partículas doradas y de agua
    const cx = this.position.x + this.size.x / 2;
    const cy = this.position.y + this.size.y / 2 - 10;

    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 65;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5,
        radius: 1.5 + Math.random() * 2,
        color: Math.random() > 0.4 ? '#fbbf24' : '#67e8f9',
      });
    }

    const messages = [
      '✨ Has lanzado una moneda a la fuente. ¡Pide un deseo!',
      '💧 El agua cristalina susurra secretos antiguos sobre la mansión.',
      '🌟 Un destello dorado surge del fondo... ¡La suerte te sonríe (+10 Vitalidad)!',
      '🍃 Las gotas de agua refrescan tu rostro. Te sientes lleno de energía.',
    ];
    const msg = messages[(this.wishesCount - 1) % messages.length];
    initiator.setNotification(msg, 3.5);

    return {
      success: true,
      message: msg,
    };
  }

  public getInteractionPrompt(initiator: GameObject): string {
    if (this.canInteract(initiator)) {
      return '⛲ [E] Lanzar una moneda y pedir un deseo';
    }
    return '';
  }

  public override update(dt: number): void {
    this.animTime += dt;

    // Emisión continua de gotas de agua desde el surtidor central
    if (Math.random() < 0.35) {
      const cx = this.position.x + this.size.x / 2;
      const cy = this.position.y + this.size.y / 2 - 12;
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 22;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.6,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        radius: 1.2 + Math.random() * 1.5,
        color: Math.random() > 0.3 ? '#a5f3fc' : '#ffffff',
      });
    }

    // Actualizar partículas
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt; // gravedad suave
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
  }

  public override render(ctx: CanvasRenderingContext2D, _camera: Camera): void {
    const cx = Math.floor(this.position.x + this.size.x / 2);
    const cy = Math.floor(this.position.y + this.size.y / 2);

    ctx.save();

    // 1. Ondas concéntricas animadas en el agua turquesa
    const numRipples = 3;
    for (let i = 0; i < numRipples; i++) {
      const progress = ((this.animTime * 0.7 + i / numRipples) % 1);
      const r = 8 + progress * 26;
      const alpha = (1 - progress) * 0.5;

      ctx.strokeStyle = `rgba(165, 243, 252, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.72, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Chorro central y salpicadura
    const jetPhase = Math.sin(this.animTime * 6);
    const jetH = 10 + jetPhase * 2.5;

    // Columna de agua central
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8 - jetH * 0.3, 2.5, jetH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corona de espuma en el nacimiento del surtidor
    ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 3.5 + Math.sin(this.animTime * 8) * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 3. Renderizar partículas de agua / destellos de deseos
    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
