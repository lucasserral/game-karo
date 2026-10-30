import type { Player } from '../../entities/Player.ts';
import type { FishingMinigame, CatchItem } from './FishingMinigame.ts';
import { MinigameManager } from '../MinigameManager.ts';

type FishingState = 'idle' | 'waiting' | 'bite' | 'success' | 'missed';

/**
 * FishingView: Renderiza la escena animada del muelle, el estanque,
 * la caña con boya y el sistema de reflejos al hundirse la boya.
 */
export class FishingView {
  private minigame: FishingMinigame;
  private animFrameId: number | null = null;
  private state: FishingState = 'idle';

  private waitTimer = 0;
  private biteTimer = 0;
  private readonly biteWindow = 1.45; // 1.45 segundos para reaccionar al hundimiento
  private animTime = 0;

  private currentCatch: CatchItem | null = null;
  private missedReason = '';
  private ripples: Array<{ x: number; y: number; radius: number; alpha: number }> = [];
  private splashParticles: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number }> = [];

  constructor(minigame: FishingMinigame) {
    this.minigame = minigame;
  }

  public render(container: HTMLElement, player: Player): void {
    const hasKey2 = player.hasKey('key_2');

    container.innerHTML = `
      <div class="fishing-widget-wrapper">
        <div class="fishing-card">
          <!-- Header -->
          <div class="fishing-header">
            <div class="fishing-title-group">
              <span class="fishing-icon">🎣</span>
              <div>
                <h4>Muelle de Pesca</h4>
                <span class="fishing-coords">(1272, 343) • Estanque del Puente</span>
              </div>
            </div>
            <button class="fishing-close-btn" id="btn-close-fishing" title="Cerrar minijuego" aria-label="Cerrar">✕</button>
          </div>

          <!-- Canvas animado de pesca -->
          <div class="fishing-canvas-container" id="fishing-canvas-container" title="Haz click en el estanque para interactuar">
            <canvas id="fishing-canvas" width="340" height="200"></canvas>
            <div class="fishing-overlay" id="fishing-overlay"></div>
          </div>

          <!-- Barra de Acción y Estado -->
          <div class="fishing-action-bar" id="fishing-action-bar">
            <!-- Rellenado dinámico por updateUI -->
          </div>

          <!-- Estadísticas y Capturas -->
          <div class="fishing-stats-bar">
            <span class="stat-pill">🐟 Peces: <strong>${player.fishCaughtCount}</strong></span>
            <span class="stat-pill">📜 Botellas: <strong>${player.bottlesFoundCount}</strong></span>
            <span class="stat-pill ${hasKey2 ? 'key-obtained' : 'key-pending'}">
              🗝️ key_2: <strong>${hasKey2 ? 'Obtenida' : 'Oculta'}</strong>
            </span>
          </div>
        </div>
      </div>
    `;

    const btnClose = container.querySelector('#btn-close-fishing');
    btnClose?.addEventListener('click', () => {
      this.cleanup();
      MinigameManager.getInstance().closeMinigame();
    });

    const canvas = container.querySelector('#fishing-canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.addEventListener('click', () => this.handleActionClick(player));
    }

    // Iniciar con lanzamiento automático si está en idle
    this.startLoop(canvas, player);
    this.startCast();
  }

  private handleActionClick(player: Player): void {
    if (this.state === 'idle') {
      this.startCast();
    } else if (this.state === 'waiting') {
      // Click demasiado pronto
      this.state = 'missed';
      this.missedReason = '¡Tiraste demasiado pronto! El pez se asustó antes de picar.';
      this.updateUI(player);
    } else if (this.state === 'bite') {
      // ¡Éxito! Atrapó el pez
      this.state = 'success';
      this.currentCatch = this.minigame.generateCatch(player);
      this.createBigSplash(210, 125);
      this.updateUI(player);
    } else if (this.state === 'success' || this.state === 'missed') {
      this.startCast();
    }
  }

  private startCast(): void {
    this.state = 'waiting';
    this.currentCatch = null;
    this.missedReason = '';
    // Tiempo aleatorio entre 2.2s y 4.2s hasta que el pez muerde y la boya se hunde
    this.waitTimer = 2.2 + Math.random() * 2.0;
    this.biteTimer = this.biteWindow;
    this.ripples = [];
    this.splashParticles = [];

    const container = document.getElementById('sidebar-minigame-container');
    if (container) {
      const player = (window as any).__activePlayer;
      if (player) this.updateUI(player);
    }
  }

  private updateUI(player: Player): void {
    const actionBar = document.getElementById('fishing-action-bar');
    const overlay = document.getElementById('fishing-overlay');
    if (!actionBar) return;

    if (this.state === 'waiting') {
      if (overlay) overlay.innerHTML = '';
      actionBar.innerHTML = `
        <div class="fishing-status-hint">
          <span class="spinner-dot"></span>
          <span>Aguarda pacientemente... La boya flotará hasta que un pez la hunda.</span>
        </div>
        <button class="btn-fishing-action btn-reel-waiting" id="btn-fishing-action">
          Tirar de la Caña
        </button>
      `;
    } else if (this.state === 'bite') {
      if (overlay) {
        overlay.innerHTML = `
          <div class="bite-alert-banner">
            <span class="bite-exclamation">❗</span>
            <span class="bite-text">¡HA PICADO! ¡CLICK YA!</span>
          </div>
        `;
      }
      actionBar.innerHTML = `
        <button class="btn-fishing-action btn-reel-bite" id="btn-fishing-action">
          ⚡ ¡TIRAR DE LA CAÑA YA!
        </button>
      `;
    } else if (this.state === 'success' && this.currentCatch) {
      if (overlay) overlay.innerHTML = '';
      const c = this.currentCatch;
      actionBar.innerHTML = `
        <div class="catch-card ${c.rarity}">
          <div class="catch-top">
            <span class="catch-icon">${c.icon}</span>
            <div class="catch-meta">
              <span class="catch-name">${c.name}</span>
              <span class="catch-rarity">${c.rarity.toUpperCase()}</span>
            </div>
          </div>
          <p class="catch-detail">${c.detail}</p>
        </div>
        <button class="btn-fishing-action btn-recast" id="btn-fishing-action">
          🎣 Lanzar Caña de Nuevo
        </button>
      `;
    } else if (this.state === 'missed') {
      if (overlay) overlay.innerHTML = '';
      actionBar.innerHTML = `
        <div class="missed-card">
          <span class="missed-icon">💨</span>
          <p class="missed-text">${this.missedReason}</p>
        </div>
        <button class="btn-fishing-action btn-recast" id="btn-fishing-action">
          🎣 Intentar de Nuevo
        </button>
      `;
    }

    const btnAction = document.getElementById('btn-fishing-action');
    btnAction?.addEventListener('click', () => this.handleActionClick(player));
  }

  private createBigSplash(x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 1.5 + Math.random() * 2.5;
      this.splashParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        size: 2 + Math.random() * 3,
      });
    }
  }

  private startLoop(canvas: HTMLCanvasElement, player: Player): void {
    (window as any).__activePlayer = player;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number): void => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      this.animTime += dt;

      // Actualizar estado del juego
      if (this.state === 'waiting') {
        this.waitTimer -= dt;
        if (this.waitTimer <= 0) {
          this.state = 'bite';
          this.createBigSplash(210, 125);
          this.updateUI(player);
        }
      } else if (this.state === 'bite') {
        this.biteTimer -= dt;
        if (this.biteTimer <= 0) {
          this.state = 'missed';
          this.missedReason = '¡Demasiado tarde! El pez se llevó la carnada y escapó.';
          this.updateUI(player);
        }
      }

      // Ondas periódicas en el agua
      if (Math.random() < 0.08) {
        const bobberY = this.state === 'bite' ? 132 : 124;
        this.ripples.push({
          x: 210 + (Math.random() - 0.5) * 4,
          y: bobberY,
          radius: 4,
          alpha: 0.8,
        });
      }

      // Renderizar lienzo
      this.draw(ctx, canvas.width, canvas.height);

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.clearRect(0, 0, w, h);

    // 1. Cielo crepuscular con degradado suave
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 75);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 75);

    // Silueta de vegetación y sauce a la distancia
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(40, 75, 45, Math.PI, 0);
    ctx.arc(95, 75, 35, Math.PI, 0);
    ctx.arc(310, 75, 50, Math.PI, 0);
    ctx.fill();

    // 2. Agua del estanque con capas de oleaje
    const waterGrad = ctx.createLinearGradient(0, 75, 0, h);
    waterGrad.addColorStop(0, '#0284c7');
    waterGrad.addColorStop(0.5, '#0369a1');
    waterGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 75, w, h - 75);

    // Destellos y líneas de oleaje
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let row = 85; row < h; row += 18) {
      const offset = Math.sin(this.animTime * 2 + row) * 8;
      ctx.beginPath();
      ctx.moveTo(70 + offset, row);
      ctx.lineTo(w - 20, row);
      ctx.stroke();
    }

    // 3. Muelle de madera a la izquierda
    const dockW = 85;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 70, dockW, h - 70);

    // Tablones y sombras del muelle
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    for (let y = 70; y < h; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(dockW, y);
      ctx.stroke();
    }

    // Poste del muelle
    ctx.fillStyle = '#92400e';
    ctx.fillRect(dockW - 12, 45, 12, 45);
    ctx.strokeStyle = '#451a03';
    ctx.strokeRect(dockW - 12, 45, 12, 45);

    // 4. Personaje pescando de perfil en el muelle
    const px = 40;
    const py = 42;

    // Sombra del personaje
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 14, py + 34, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Piernas y cuerpo
    ctx.fillStyle = '#1e293b'; // pantalones
    ctx.fillRect(px + 6, py + 22, 12, 12);
    ctx.fillStyle = '#0284c7'; // túnica azul
    ctx.fillRect(px + 4, py + 10, 16, 14);
    ctx.fillStyle = '#fbcfe8'; // cara
    ctx.fillRect(px + 8, py + 2, 10, 8);
    ctx.fillStyle = '#0369a1'; // gorra
    ctx.fillRect(px + 7, py - 2, 13, 5);

    // 5. Caña de pescar curvada
    const rodBaseX = px + 18;
    const rodBaseY = py + 14;
    const rodTipX = 145;
    const isBiting = this.state === 'bite';
    const rodTipY = isBiting ? 58 : 38; // La caña se dobla profundamente cuando pica

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rodBaseX, rodBaseY);
    ctx.quadraticCurveTo(rodBaseX + 45, rodBaseY - 20, rodTipX, rodTipY);
    ctx.stroke();

    // 6. Sedal / Línea de pesca
    const bobberX = 210;
    // Si la boya se hunde (bite), baja a y = 134, si flota normal, sube y baja suavemente
    const bobberBob = Math.sin(this.animTime * 4) * 2.5;
    const bobberY = isBiting ? 134 : 124 + bobberBob;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.quadraticCurveTo(rodTipX + 25, (rodTipY + bobberY) / 2 + 10, bobberX, bobberY);
    ctx.stroke();

    // 7. Ondas en el agua
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += 0.45;
      rip.alpha -= 0.015;

      if (rip.alpha <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }

      ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 8. Partículas de chapoteo
    for (let i = this.splashParticles.length - 1; i >= 0; i--) {
      const p = this.splashParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gravedad
      p.alpha -= 0.02;

      if (p.alpha <= 0) {
        this.splashParticles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. Boya de pesca (Bolla: Mitad roja, mitad blanca)
    ctx.save();
    ctx.translate(bobberX, bobberY);

    if (isBiting) {
      // Efecto de vibración y alerta cuando está hundida
      const shake = (Math.random() - 0.5) * 3;
      ctx.translate(shake, 0);

      // Brillo rojo de alerta bajo el agua
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
      glow.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mitad superior roja
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 6, Math.PI, 0);
    ctx.fill();

    // Mitad inferior blanca
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI);
    ctx.fill();

    // Borde
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Palito superior de la boya
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-1, -10, 2, 5);

    ctx.restore();

    // 10. Indicador visual cuando pica
    if (isBiting) {
      ctx.save();
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      const bounce = Math.sin(this.animTime * 15) * 4;
      ctx.fillText('❗', bobberX, bobberY - 22 + bounce);
      ctx.restore();
    }
  }

  public cleanup(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    delete (window as any).__activePlayer;
  }
}
