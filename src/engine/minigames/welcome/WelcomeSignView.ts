import type { Player } from '../../entities/Player.ts';
import type { WelcomeSignMinigame } from './WelcomeSignMinigame.ts';
import { MinigameManager } from '../MinigameManager.ts';

/**
 * WelcomeSignView: Renderiza en el panel lateral el pergamino/cartel de bienvenida de la finca,
 * explicando el objetivo (encontrar a Karolina), las instrucciones y la pista clave para abrir
 * las puertas de la mansión pescando en el lago.
 */
export class WelcomeSignView {
  constructor(_minigame: WelcomeSignMinigame) {}

  public render(container: HTMLElement, player: Player): void {
    const hasKey2 = player.hasKey('key_2');
    const hasKey1 = player.hasKey('key_1');
    const hasKey3 = player.hasKey('key_3');
    const hasKey4 = player.hasKey('key_4');
    const hasKey5 = player.hasKey('key_5');

    const totalFound = [hasKey1, hasKey2, hasKey3, hasKey4, hasKey5].filter(Boolean).length;

    container.innerHTML = `
      <div class="welcome-sign-wrapper">
        <div class="welcome-sign-card">
          <!-- Pushpin / Header -->
          <div class="welcome-sign-pin" title="Clavado en el cartel de madera">🪧</div>

          <div class="welcome-sign-header">
            <div class="welcome-tag-group">
              <span class="welcome-sign-tag">Entrada Principal • (340, 945)</span>
              <h4>Cartel de la Finca</h4>
            </div>
            <button class="welcome-close-btn" id="btn-close-welcome" title="Cerrar cartel" aria-label="Cerrar cartel">✕</button>
          </div>

          <div class="welcome-sign-body">
            <!-- Objetivo Principal del Juego -->
            <div class="welcome-goal-banner">
              <div class="goal-icon-sparkle">💖</div>
              <div class="goal-text-content">
                <span class="goal-eyebrow">OBJETIVO DEL JUEGO</span>
                <h3 class="goal-title">Encontrar a Karolina</h3>
                <p class="goal-desc">
                  ¡Bienvenido a la Finca! Tu misión más importante es explorar sus tierras, 
                  desentrañar cada secreto y abrirte paso hasta el corazón de la mansión para 
                  <strong>encontrar a Karolina</strong>.
                </p>
              </div>
            </div>

            <!-- Pista Clave Inicial (Destacada) -->
            <div class="welcome-hint-box">
              <div class="hint-header">
                <span class="hint-badge-icon">💡</span>
                <strong>Pista Inicial de la Finca</strong>
              </div>
              <p class="hint-body">
                Las imponentes puertas de la mansión permanecen selladas. 
                <span class="hint-highlight">La primera llave a conseguir para abrir las puertas de la mansión es pescando en el lago</span>.
              </p>
              <div class="hint-location-pill">
                <span>📍 Muelle Oriental: Coordenadas <strong>(1272, 343)</strong></span>
              </div>
            </div>

            <!-- Desafíos y Llaves de la Mansión -->
            <div class="welcome-section-title">
              <span>🗝️ Desafíos y Llaves Secretas (${totalFound}/5)</span>
            </div>

            <div class="welcome-challenges-list">
              <!-- Minijuego 2: Pesca (Pista 1) -->
              <div class="challenge-item ${hasKey2 ? 'item-done' : 'item-active'}">
                <div class="challenge-icon-box">🎣</div>
                <div class="challenge-info">
                  <div class="challenge-title-row">
                    <strong>1. Pesca en el Lago (Muelle)</strong>
                    <span class="challenge-status-badge ${hasKey2 ? 'badge-done' : 'badge-key'}">
                      ${hasKey2 ? '✓ Obtenida' : '🔑 key_2'}
                    </span>
                  </div>
                  <span class="challenge-coord">Coord: (1272, 343) • ¡Primera llave para entrar a la mansión!</span>
                </div>
              </div>

              <!-- Minijuego 1: Foto -->
              <div class="challenge-item ${hasKey1 ? 'item-done' : ''}">
                <div class="challenge-icon-box">🖼️</div>
                <div class="challenge-info">
                  <div class="challenge-title-row">
                    <strong>2. Rompecabezas del Retrato</strong>
                    <span class="challenge-status-badge ${hasKey1 ? 'badge-done' : 'badge-pending'}">
                      ${hasKey1 ? '✓ Obtenida' : '🔑 key_1'}
                    </span>
                  </div>
                  <span class="challenge-coord">Coord: (240, 740) • Reúne los 4 pedacitos de foto (${player.photoFragments.size}/4)</span>
                </div>
              </div>

              <!-- Minijuego 3: Quiz -->
              <div class="challenge-item ${hasKey3 ? 'item-done' : ''}">
                <div class="challenge-icon-box">💌</div>
                <div class="challenge-info">
                  <div class="challenge-title-row">
                    <strong>3. Carta de Recuerdos (Quiz)</strong>
                    <span class="challenge-status-badge ${hasKey3 ? 'badge-done' : 'badge-pending'}">
                      ${hasKey3 ? '✓ Obtenida' : '🔑 key_3'}
                    </span>
                  </div>
                  <span class="challenge-coord">Coord: (415, 145) • Preguntas sobre nuestra historia</span>
                </div>
              </div>

              <!-- Minijuego 4: Cartas de Memoria -->
              <div class="challenge-item ${hasKey4 ? 'item-done' : ''}">
                <div class="challenge-icon-box">🃏</div>
                <div class="challenge-info">
                  <div class="challenge-title-row">
                    <strong>4. Tablero de Cartas (Memoria)</strong>
                    <span class="challenge-status-badge ${hasKey4 ? 'badge-done' : 'badge-pending'}">
                      ${hasKey4 ? '✓ Obtenida' : '🔑 key_4'}
                    </span>
                  </div>
                  <span class="challenge-coord">Coord: (970, 370) • Encuentra todas las parejas de símbolos</span>
                </div>
              </div>

              <!-- Minijuego 5: Secuencia de Platos -->
              <div class="challenge-item ${hasKey5 ? 'item-done' : ''}">
                <div class="challenge-icon-box">🍽️</div>
                <div class="challenge-info">
                  <div class="challenge-title-row">
                    <strong>5. Secuencia de Platos (16 Rondas)</strong>
                    <span class="challenge-status-badge ${hasKey5 ? 'badge-done' : 'badge-pending'}">
                      ${hasKey5 ? '✓ Obtenida' : '🔑 key_5'}
                    </span>
                  </div>
                  <span class="challenge-coord">Coord: (99, 600) • Repite la melodía y colores a velocidad creciente</span>
                </div>
              </div>
            </div>

            <!-- Instrucciones de Movimiento & Interacción -->
            <div class="welcome-controls-bar">
              <div class="control-tip">
                <span class="key-pill">W</span><span class="key-pill">A</span><span class="key-pill">S</span><span class="key-pill">D</span>
                <span class="control-label">Moverse</span>
              </div>
              <div class="control-tip">
                <span class="key-pill key-action-pill">E</span>
                <span class="control-label">Interactuar</span>
              </div>
              <div class="control-tip">
                <span class="key-pill">ESC</span>
                <span class="control-label">Cerrar</span>
              </div>
            </div>

            <!-- Botón de Acción -->
            <button class="welcome-btn-start" id="btn-start-adventure">
              ✨ ¡Comenzar Aventura!
            </button>
          </div>
        </div>
      </div>
    `;

    // Event listener para cerrar
    const btnClose = container.querySelector('#btn-close-welcome');
    btnClose?.addEventListener('click', () => {
      this.closeAndRefocus();
    });

    const btnStart = container.querySelector('#btn-start-adventure');
    btnStart?.addEventListener('click', () => {
      this.closeAndRefocus();
    });
  }

  private closeAndRefocus(): void {
    MinigameManager.getInstance().closeMinigame();
    const canvas = document.getElementById('game-canvas');
    canvas?.focus();
  }

  public cleanup(): void {}
}
