import type { Player } from '../../entities/Player.ts';
import type { SimonPlatesMinigame, PlateColor } from './SimonPlatesMinigame.ts';
import { PLATES_INFO } from './SimonPlatesMinigame.ts';
import { MinigameManager } from '../MinigameManager.ts';

type SimonState = 'idle' | 'showing' | 'player_turn' | 'won' | 'error';

/**
 * SimonPlatesView: Renderiza la interfaz interactiva con platos de porcelana de colores,
 * síntesis de audio Web Audio API para notas musicales y animaciones de destello.
 */
export class SimonPlatesView {
  private minigame: SimonPlatesMinigame;
  private state: SimonState = 'idle';
  private audioCtx: AudioContext | null = null;
  private activePlate: PlateColor | null = null;
  private statusMessage = 'Presiona "Comenzar" para memorizar la secuencia.';
  private isMuted = false;
  private timeouts: number[] = [];

  constructor(minigame: SimonPlatesMinigame) {
    this.minigame = minigame;
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playTone(freq: number, duration = 0.3): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Envolvente suave estilo campana/marimba
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignorar restricciones de audio
    }
  }

  private playFanfare(): void {
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      const t = window.setTimeout(() => {
        this.playTone(freq, 0.4);
      }, idx * 120);
      this.timeouts.push(t);
    });
  }

  /**
   * Calcula el tiempo de destello y el intervalo entre platos para la ronda actual (1 a 16).
   * A medida que se avanza de ronda, la secuencia se reproduce progresivamente más rápido.
   */
  public getSpeedSettings(): { flashDuration: number; stepInterval: number; speedMultiplier: string } {
    const round = this.minigame.currentRound;
    // Factor de progreso de 0 (ronda 1) a 1 (ronda 16)
    const factor = Math.min(1, Math.max(0, (round - 1) / 15));

    // Duración del destello: de 450ms en ronda 1 a 150ms en ronda 16
    const flashDuration = Math.round(450 - factor * 300);

    // Intervalo entre cada plato: de 660ms en ronda 1 a 210ms en ronda 16
    const stepInterval = Math.round(660 - factor * 450);

    // Multiplicador visual (1.0x hasta 2.8x)
    const speedMultiplier = (1.0 + factor * 1.8).toFixed(1);

    return { flashDuration, stepInterval, speedMultiplier };
  }

  public render(container: HTMLElement, player: Player): void {
    const isCompleted = this.minigame.isRewardClaimed;
    const currentRound = this.minigame.currentRound;
    const totalRounds = this.minigame.totalRounds;
    const currentSeq = this.minigame.getCurrentSequence();
    const speedSettings = this.getSpeedSettings();

    container.innerHTML = `
      <div class="simon-widget-wrapper">
        <div class="simon-card ${isCompleted ? 'simon-completed-glow' : ''}">
          <!-- Header -->
          <div class="simon-header">
            <div class="simon-title-group">
              <span class="simon-header-icon">🍽️</span>
              <div>
                <h4>Platos de Colores</h4>
                <span class="simon-coords">(99, 600) • Alacena de la Mansión</span>
              </div>
            </div>
            <button class="simon-close-btn" id="btn-close-simon" title="Cerrar alacena" aria-label="Cerrar">✕</button>
          </div>

          <!-- Progress Bar & Speed Indicator (16 Rondas) -->
          <div class="simon-stats-row">
            <div class="simon-progress-meter-wrapper">
              <div class="simon-progress-info">
                <span class="simon-round-badge">Ronda <strong>${isCompleted ? totalRounds : currentRound}</strong> de ${totalRounds}</span>
                <span class="simon-speed-badge" title="Velocidad actual">⚡ ${speedSettings.speedMultiplier}x vel</span>
              </div>
              <div class="simon-progress-meter">
                <div class="simon-progress-fill" style="width: ${((isCompleted ? totalRounds : currentRound - 1) / totalRounds) * 100}%;"></div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="simon-body">
            ${
              isCompleted
                ? `
              <!-- Pantalla de Victoria -->
              <div class="simon-success-view">
                <div class="simon-trophy-icon">🏆</div>
                <h3>¡Secuencia Maestra Completada!</h3>
                <p>El mecanismo secreto de la alacena se ha desbloqueado tras afinar todas las notas.</p>

                <div class="simon-reward-pill">
                  <span class="reward-key-icon">🗝️</span>
                  <div>
                    <strong>¡Llave key_5 Obtenida!</strong>
                    <span>La Llave de los Platos ya se encuentra en tu inventario.</span>
                  </div>
                </div>

                <button class="simon-btn-action simon-btn-replay" id="btn-replay-simon">
                  🍽️ Repetir Desafío
                </button>
              </div>
            `
                : `
              <!-- Estado y Feedback -->
              <div class="simon-status-box ${this.state}">
                <span class="status-indicator-dot"></span>
                <span class="status-message-text">${this.statusMessage}</span>
              </div>

              <!-- Tablero Circular de Platos de Porcelana (2x2) -->
              <div class="simon-plates-grid ${this.state === 'showing' ? 'grid-locked' : ''}">
                ${(['red', 'blue', 'green', 'yellow'] as PlateColor[])
                  .map((c) => {
                    const info = PLATES_INFO[c];
                    const isActive = this.activePlate === c;
                    return `
                    <button class="simon-plate plate-${c} ${isActive ? 'plate-active' : ''}"
                            data-color="${c}"
                            title="${info.name}"
                            aria-label="${info.name}">
                      <div class="plate-inner-rim">
                        <span class="plate-symbol">${info.icon}</span>
                      </div>
                    </button>
                  `;
                  })
                  .join('')}
              </div>

              <!-- Controles de Inicio / Reintento -->
              <div class="simon-controls">
                ${
                  this.state === 'idle'
                    ? `
                  <button class="simon-btn-action simon-btn-start" id="btn-start-simon">
                    ▶️ Iniciar Secuencia (Ronda ${currentRound})
                  </button>
                `
                    : this.state === 'player_turn'
                      ? `
                  <div class="simon-input-counter">
                    Paso: <strong>${this.minigame.playerStep}</strong> / ${currentSeq.length}
                  </div>
                `
                      : ''
                }
              </div>
            `
            }
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const btnClose = container.querySelector('#btn-close-simon');
    btnClose?.addEventListener('click', () => {
      this.cleanup();
      MinigameManager.getInstance().closeMinigame();
    });

    const btnStart = container.querySelector('#btn-start-simon');
    btnStart?.addEventListener('click', () => {
      this.playRoundSequence(container, player);
    });

    const btnReplay = container.querySelector('#btn-replay-simon');
    btnReplay?.addEventListener('click', () => {
      this.minigame.restartGame();
      this.state = 'idle';
      this.statusMessage = 'Presiona "Comenzar" para memorizar la secuencia.';
      this.render(container, player);
    });

    if (!isCompleted && this.state === 'player_turn') {
      const plateButtons = container.querySelectorAll('.simon-plate');
      plateButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const color = (e.currentTarget as HTMLElement).getAttribute('data-color') as PlateColor;
          if (color) {
            this.handlePlayerClick(color, container, player);
          }
        });
      });
    }
  }

  private flashPlate(color: PlateColor, duration = 350): void {
    this.activePlate = color;
    const info = PLATES_INFO[color];
    this.playTone(info.freq, duration / 1000);

    const plateEl = document.querySelector(`.simon-plate.plate-${color}`);
    if (plateEl) {
      plateEl.classList.add('plate-active');
    }

    const t = window.setTimeout(() => {
      this.activePlate = null;
      if (plateEl) {
        plateEl.classList.remove('plate-active');
      }
    }, duration);
    this.timeouts.push(t);
  }

  private playRoundSequence(container: HTMLElement, player: Player): void {
    this.state = 'showing';
    const { flashDuration, stepInterval, speedMultiplier } = this.getSpeedSettings();
    this.statusMessage = `👀 ¡Observa y escucha la secuencia! (${speedMultiplier}x vel)`;
    this.render(container, player);

    const sequence = this.minigame.getCurrentSequence();
    let delay = Math.max(350, Math.round(520 - (this.minigame.currentRound / 16) * 180));

    sequence.forEach((color, idx) => {
      const t = window.setTimeout(() => {
        this.flashPlate(color, flashDuration);

        if (idx === sequence.length - 1) {
          // Secuencia completa mostrada, turno del jugador
          const postDelay = Math.max(250, flashDuration + 120);
          const tEnd = window.setTimeout(() => {
            this.state = 'player_turn';
            this.statusMessage = `✨ ¡Tu turno! Repite los ${sequence.length} platos en orden.`;
            this.render(container, player);
          }, postDelay);
          this.timeouts.push(tEnd);
        }
      }, delay);
      this.timeouts.push(t);
      delay += stepInterval;
    });
  }

  private handlePlayerClick(color: PlateColor, container: HTMLElement, player: Player): void {
    const { flashDuration } = this.getSpeedSettings();
    this.flashPlate(color, Math.min(220, flashDuration));

    const result = this.minigame.checkPlayerInput(color, player);

    if (result.correct) {
      if (result.gameWon) {
        this.state = 'won';
        this.playFanfare();
        this.render(container, player);
      } else if (result.roundComplete) {
        // Ronda superada
        this.state = 'showing';
        this.statusMessage = `🌟 ¡Excelente! Ronda ${this.minigame.currentRound - 1} completada. Acelerando ritmo...`;
        this.render(container, player);

        const nextDelay = Math.max(500, Math.round(950 - (this.minigame.currentRound / 16) * 400));
        const t = window.setTimeout(() => {
          this.playRoundSequence(container, player);
        }, nextDelay);
        this.timeouts.push(t);
      } else {
        // Correcto, pero quedan más pasos en esta ronda
        this.render(container, player);
      }
    } else {
      // Error
      this.state = 'error';
      this.statusMessage = '❌ ¡Secuencia incorrecta! Volviendo a mostrar la ronda...';
      this.playTone(130.81, 0.4); // Tono grave de error (C3)
      this.render(container, player);

      const t = window.setTimeout(() => {
        this.playRoundSequence(container, player);
      }, 1250);
      this.timeouts.push(t);
    }
  }

  public cleanup(): void {
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts = [];
    this.activePlate = null;
    this.state = 'idle';
  }
}
