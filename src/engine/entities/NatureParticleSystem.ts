import { GameObject } from '../core/GameObject.ts';
import type { Camera } from '../core/Camera.ts';

interface NatureParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  type: 'petal' | 'leaf';
  color: string;
}

/**
 * NatureParticleSystem: Sistema ambiental que genera pétalos de cerezo rosa y hojas verdes
 * meciéndose suavemente en la brisa a través de los jardines de la finca.
 */
export class NatureParticleSystem extends GameObject {
  private particles: NatureParticle[] = [];
  private mapWidth: number;
  private mapHeight: number;

  constructor(mapWidth = 1600, mapHeight = 1066, maxParticles = 65) {
    super(0, 0, mapWidth, mapHeight, 28); // zIndex 28 (flota sobre los personajes y follaje)
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // Inicializar partículas distribuidas por el mapa
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  private createParticle(randomPosition = false): NatureParticle {
    const isPetal = Math.random() > 0.4;
    return {
      x: randomPosition ? Math.random() * this.mapWidth : -10 + Math.random() * 20,
      y: randomPosition ? Math.random() * this.mapHeight : Math.random() * this.mapHeight,
      vx: 18 + Math.random() * 28, // Viento hacia el este / sureste
      vy: 8 + Math.random() * 18,
      size: isPetal ? 2 + Math.random() * 2 : 3 + Math.random() * 2.5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4,
      type: isPetal ? 'petal' : 'leaf',
      color: isPetal
        ? Math.random() > 0.5 ? '#fbcfe8' : '#f472b6'
        : Math.random() > 0.5 ? '#86efac' : '#4ade80',
    };
  }

  public override update(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt + Math.sin(p.y * 0.02) * 12 * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;

      // Reciclar si sale del mapa
      if (p.x > this.mapWidth + 20 || p.y > this.mapHeight + 20) {
        Object.assign(p, this.createParticle(false));
      }
    }
  }

  public override render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const vb = camera.getVisibleBounds();

    ctx.save();
    for (const p of this.particles) {
      // Frustum culling para partículas
      if (p.x < vb.left - 10 || p.x > vb.right + 10 || p.y < vb.top - 10 || p.y > vb.bottom + 10) {
        continue;
      }

      ctx.save();
      ctx.translate(Math.floor(p.x), Math.floor(p.y));
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.75;

      if (p.type === 'petal') {
        // Pétalo elíptico
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Hoja pequeña con punta
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.quadraticCurveTo(0, -p.size * 0.5, p.size, 0);
        ctx.quadraticCurveTo(0, p.size * 0.5, -p.size, 0);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
