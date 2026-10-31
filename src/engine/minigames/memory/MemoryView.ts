import type { Player } from '../../entities/Player.ts';
import type { MemoryMinigame } from './MemoryMinigame.ts';
import { MinigameManager } from '../MinigameManager.ts';

/**
 * MemoryView: Renderiza el tablero 4x4 de cartas de memoria en 3D con volteo interactivo.
 */
export class MemoryView {
  private minigame: MemoryMinigame;
  private isProcessing = false;

  constructor(minigame: MemoryMinigame) {
    this.minigame = minigame;
  }

  public render(container: HTMLElement, player: Player): void {
    const isCompleted = this.minigame.isRewardClaimed;
    const cards = this.minigame.cards;
    const pairsFound = this.minigame.matchedPairsCount;
    const totalPairs = this.minigame.totalPairs;
    const moves = this.minigame.movesCount;

    container.innerHTML = `
      <div class="memory-widget-wrapper">
        <div class="memory-card-board ${isCompleted ? 'board-completed-glow' : ''}">
          <!-- Header -->
          <div class="memory-header">
            <div class="memory-title-group">
              <span class="memory-header-icon">🃏</span>
              <div>
                <h4>Juego de Memoria</h4>
                <span class="memory-coords">(970, 370) • Tablero de Cartas</span>
              </div>
            </div>
            <button class="memory-close-btn" id="btn-close-memory" title="Cerrar tablero" aria-label="Cerrar">✕</button>
          </div>

          <!-- Stats Bar -->
          <div class="memory-stats-row">
            <span class="memory-stat-pill">Parejas: <strong>${pairsFound} / ${totalPairs}</strong></span>
            <span class="memory-stat-pill">Movimientos: <strong>${moves}</strong></span>
            <button class="memory-btn-restart" id="btn-restart-memory" title="Reiniciar baraja">🔄 Barajar</button>
          </div>

          <!-- Body / Grid or Success screen -->
          <div class="memory-body">
            ${
              isCompleted
                ? `
              <div class="memory-success-banner">
                <span class="memory-trophy-icon">🏆</span>
                <h3>¡Todas las parejas encontradas!</h3>
                <p>Tu agudeza mental ha revelado el compartimento secreto del tablero.</p>

                <div class="memory-reward-pill">
                  <span class="reward-key-icon">🗝️</span>
                  <div>
                    <strong>¡Llave key_4 Obtenida!</strong>
                    <span>La Llave Mística de las Cartas ya está en tu inventario.</span>
                  </div>
                </div>

                <button class="memory-btn-playagain" id="btn-playagain-memory">
                  🃏 Jugar otra partida
                </button>
              </div>
            `
                : `
              <!-- Rejilla 4x4 de cartas de memoria -->
              <div class="memory-grid-4x4" id="memory-grid">
                ${cards
                  .map((card, idx) => {
                    const flippedClass = card.isFlipped || card.isMatched ? 'is-flipped' : '';
                    const matchedClass = card.isMatched ? 'is-matched' : '';
                    return `
                    <div class="memory-card-item ${flippedClass} ${matchedClass}" data-card-idx="${idx}">
                      <div class="card-inner">
                        <!-- Cara oculta (dorso de la carta) -->
                        <div class="card-face card-back">
                          <span class="card-back-pattern">🎴</span>
                        </div>

                        <!-- Cara visible (símbolo) -->
                        <div class="card-face card-front">
                          <span class="card-symbol">${card.symbol}</span>
                          <span class="card-name">${card.name}</span>
                        </div>
                      </div>
                    </div>
                  `;
                  })
                  .join('')}
              </div>

              ${
                !isCompleted
                  ? `
                <button class="btn-debug-skip" id="btn-debug-key4" title="Modo Debugging: Obtener llave key_4">
                  ⚡ [Debug: Obtener Llave key_4]
                </button>
              `
                  : ''
              }
            `
            }
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const btnClose = container.querySelector('#btn-close-memory');
    btnClose?.addEventListener('click', () => {
      MinigameManager.getInstance().closeMinigame();
    });

    const btnDebug = container.querySelector('#btn-debug-key4');
    btnDebug?.addEventListener('click', () => {
      this.minigame.cards.forEach((c) => {
        c.isMatched = true;
        c.isFlipped = true;
      });
      this.minigame.matchedPairsCount = this.minigame.totalPairs;
      this.minigame.rewardPlayer(player);
      this.render(container, player);
    });

    const btnRestart = container.querySelector('#btn-restart-memory');
    btnRestart?.addEventListener('click', () => {
      this.minigame.restartGame();
      this.render(container, player);
    });

    const btnPlayAgain = container.querySelector('#btn-playagain-memory');
    btnPlayAgain?.addEventListener('click', () => {
      this.minigame.restartGame();
      this.render(container, player);
    });

    if (!isCompleted) {
      const cardElements = container.querySelectorAll('.memory-card-item');
      cardElements.forEach((el) => {
        el.addEventListener('click', (e) => {
          if (this.isProcessing) return;
          const idxStr = (e.currentTarget as HTMLElement).getAttribute('data-card-idx');
          if (idxStr !== null) {
            this.handleCardClick(parseInt(idxStr, 10), player, container);
          }
        });
      });
    }
  }

  private handleCardClick(index: number, player: Player, container: HTMLElement): void {
    const cards = this.minigame.cards;
    const card = cards[index];

    // Ignorar cartas ya volteadas o emparejadas
    if (!card || card.isFlipped || card.isMatched) {
      return;
    }

    // Voltear carta
    card.isFlipped = true;
    this.minigame.flippedCardIndices.push(index);
    this.render(container, player);

    // Si hay 2 cartas volteadas, comprobar coincidencia
    if (this.minigame.flippedCardIndices.length === 2) {
      this.minigame.movesCount++;
      const [idx1, idx2] = this.minigame.flippedCardIndices;
      const card1 = cards[idx1];
      const card2 = cards[idx2];

      if (card1.pairId === card2.pairId) {
        // ¡Coincidencia!
        card1.isMatched = true;
        card2.isMatched = true;
        this.minigame.matchedPairsCount++;
        this.minigame.flippedCardIndices = [];

        // Comprobar si completó todas las parejas
        if (this.minigame.matchedPairsCount === this.minigame.totalPairs) {
          setTimeout(() => {
            this.minigame.rewardPlayer(player);
            this.render(container, player);
          }, 600);
        } else {
          this.render(container, player);
        }
      } else {
        // No coinciden: bloquear brevemente y voltear boca abajo
        this.isProcessing = true;
        setTimeout(() => {
          card1.isFlipped = false;
          card2.isFlipped = false;
          this.minigame.flippedCardIndices = [];
          this.isProcessing = false;
          this.render(container, player);
        }, 850);
      }
    }
  }
}
