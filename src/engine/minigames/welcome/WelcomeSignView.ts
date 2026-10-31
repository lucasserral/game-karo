import type { Player } from '../../entities/Player.ts';
import type { WelcomeSignMinigame } from './WelcomeSignMinigame.ts';
import { MinigameManager } from '../MinigameManager.ts';

/**
 * WelcomeSignView: Renderiza en el panel lateral el pergamino/cartel de bienvenida de la finca,
 * explicando detalladamente el objetivo (encontrar a Karolina), la ruta de progresión y la guía
 * completa de dónde buscar las llaves de cada una de las puertas de la finca.
 */
export class WelcomeSignView {
  constructor(_minigame: WelcomeSignMinigame) {}

  public render(container: HTMLElement, player: Player): void {
    const hasKey2 = player.hasKey('key_2');
    const hasKey1 = player.hasKey('key_1');
    const hasKey3 = player.hasKey('key_3');
    const hasKey4 = player.hasKey('key_4');
    const hasKey5 = player.hasKey('key_5');
    const hasRoomKey = player.hasKey('room_key');
    const hasIronKey = player.hasKey('iron_key');

    const totalKeys = [
      hasKey1,
      hasKey2,
      hasKey3,
      hasKey4,
      hasKey5,
      hasRoomKey,
      hasIronKey,
    ].filter(Boolean).length;

    const fragmentCount = player.photoFragments.size;

    container.innerHTML = `
      <div class="welcome-sign-wrapper">
        <div class="welcome-sign-card">
          <!-- Pushpin / Header -->
          <div class="welcome-sign-pin" title="Clavado en el cartel de madera">🪧</div>

          <div class="welcome-sign-header">
            <div class="welcome-tag-group">
              <span class="welcome-sign-tag">Entrada Principal • (340, 945)</span>
              <h4>Cartel de la Finca & Guía de Puertas</h4>
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

            <!-- Ruta de Progresión Principal Sugerida (Pipeline Paso a Paso) -->
            <div class="welcome-path-box">
              <div class="welcome-path-header">
                <span class="welcome-path-title">
                  🧭 Ruta Principal hacia Karolina
                </span>
                <span class="challenge-status-badge ${hasKey5 ? 'badge-done' : 'badge-key'}">
                  ${hasKey5 ? '✓ Lista para entrar' : 'En progreso'}
                </span>
              </div>

              <div class="welcome-path-steps">
                <div class="path-step-row ${hasKey2 ? 'step-done' : 'step-active'}">
                  <span class="step-number-tag">Paso 1</span>
                  <span>🎣 <strong>Muelle del Lago (1272, 343)</strong>: Pescar la <em>Llave Marina (key_2)</em> ${hasKey2 ? '✓' : ''}</span>
                </div>
                <div class="step-arrow-down">▼</div>
                <div class="path-step-row ${hasKey2 ? (hasKey5 ? 'step-done' : 'step-active') : ''}">
                  <span class="step-number-tag">Paso 2</span>
                  <span>🚪 <strong>Puerta de Cocina (91, 720)</strong>: Abrir con Llave Marina para entrar ${hasKey2 ? '✓' : '(Requiere Paso 1)'}</span>
                </div>
                <div class="step-arrow-down">▼</div>
                <div class="path-step-row ${hasKey5 ? 'step-done' : (hasKey2 ? 'step-active' : '')}">
                  <span class="step-number-tag">Paso 3</span>
                  <span>🍽️ <strong>Alacena en Cocina (99, 600)</strong>: Secuencia de 16 platos ➔ <em>Llave de los Platos (key_5)</em> ${hasKey5 ? '✓' : ''}</span>
                </div>
                <div class="step-arrow-down">▼</div>
                <div class="path-step-row ${hasKey5 ? 'step-active' : ''}">
                  <span class="step-number-tag">Paso 4</span>
                  <span>🏰 <strong>Puerta Principal (373, 865)</strong>: ¡Abrir con key_5 para encontrar a Karolina!</span>
                </div>
              </div>
            </div>

            <!-- Título de Sección: Guía de Cada Puerta -->
            <div class="welcome-section-title">
              <span>🗝️ Dónde Buscar las Llaves de Cada Puerta</span>
              <span style="color: #fbbf24; font-size: 0.75rem;">${totalKeys}/7 Llaves</span>
            </div>

            <div class="welcome-challenges-list">

              <!-- 1. Puerta de la Cocina (key_2) -->
              <div class="door-guide-card ${hasKey2 ? 'door-unlocked' : 'door-active-lead'}">
                <div class="door-guide-header">
                  <div class="door-name-box">
                    <span>🍳</span>
                    <strong>Puerta de la Cocina</strong>
                  </div>
                  <span class="door-coord-badge">Puerta: (91, 720)</span>
                  <span class="challenge-status-badge ${hasKey2 ? 'badge-done' : 'badge-key'}">
                    ${hasKey2 ? '✓ Llave Obtenida' : '🔑 key_2'}
                  </span>
                </div>
                <div class="door-search-box">
                  <div class="door-search-loc">
                    <span>📍 Dónde buscar:</span>
                    <strong>Muelle del lago oriental (1272, 343)</strong>
                  </div>
                  <div class="door-search-how">
                    Usa la caña de pescar en el muelle de madera este y haz click justo cuando muerda el anzuelo. ¡Pesca hasta extraer la brillante Llave Marina!
                  </div>
                </div>
                <div class="door-unlocks-label">
                  🔓 <strong>Qué desbloquea:</strong> Permite ingresar a la cocina donde está el minijuego de los platos musicales.
                </div>
              </div>

              <!-- 2. Puerta Principal (key_5) -->
              <div class="door-guide-card ${hasKey5 ? 'door-unlocked' : ''}">
                <div class="door-guide-header">
                  <div class="door-name-box">
                    <span>🏰</span>
                    <strong>Puerta Principal de la Mansión</strong>
                  </div>
                  <span class="door-coord-badge">Puerta: (373, 865)</span>
                  <span class="challenge-status-badge ${hasKey5 ? 'badge-done' : 'badge-pending'}">
                    ${hasKey5 ? '✓ Llave Obtenida' : '🔑 key_5'}
                  </span>
                </div>
                <div class="door-search-box">
                  <div class="door-search-loc">
                    <span>📍 Dónde buscar:</span>
                    <strong>Alacena dentro de la cocina (99, 600)</strong>
                  </div>
                  <div class="door-search-how">
                    Entra a la cocina en (91, 720) usando la Llave Marina de pesca, acércate a la alacena y repite la melodía de los 4 platos durante 16 rondas progresivas.
                  </div>
                </div>
                <div class="door-unlocks-label">
                  🔓 <strong>Qué desbloquea:</strong> Abre el gran salón principal de la mansión, el paso definitivo para encontrar a Karolina.
                </div>
              </div>

              <!-- 3. Puerta de la Fuente (key_4) -->
              <div class="door-guide-card ${hasKey4 ? 'door-unlocked' : ''}">
                <div class="door-guide-header">
                  <div class="door-name-box">
                    <span>⛲</span>
                    <strong>Puerta de la Fuente</strong>
                  </div>
                  <span class="door-coord-badge">Puerta: (609, 610)</span>
                  <span class="challenge-status-badge ${hasKey4 ? 'badge-done' : 'badge-pending'}">
                    ${hasKey4 ? '✓ Llave Obtenida' : '🔑 key_4'}
                  </span>
                </div>
                <div class="door-search-box">
                  <div class="door-search-loc">
                    <span>📍 Dónde buscar:</span>
                    <strong>Tablero de juego en el jardín este (928, 345)</strong>
                  </div>
                  <div class="door-search-how">
                    Encuentra todas las parejas de cartas idénticas volteándolas sobre el tablero de memoria en el jardín este.
                  </div>
                </div>
                <div class="door-unlocks-label">
                  🔓 <strong>Qué desbloquea:</strong> Abre el paso hacia el patio de la fuente central y los jardines interiores.
                </div>
              </div>

              <!-- 4. Puerta del Cristalero (key_3) -->
              <div class="door-guide-card ${hasKey3 ? 'door-unlocked' : ''}">
                <div class="door-guide-header">
                  <div class="door-name-box">
                    <span>🌿</span>
                    <strong>Puerta del Cristalero</strong>
                  </div>
                  <span class="door-coord-badge">Puerta: (885, 655)</span>
                  <span class="challenge-status-badge ${hasKey3 ? 'badge-done' : 'badge-pending'}">
                    ${hasKey3 ? '✓ Llave Obtenida' : '🔑 key_3'}
                  </span>
                </div>
                <div class="door-search-box">
                  <div class="door-search-loc">
                    <span>📍 Dónde buscar:</span>
                    <strong>Escritorio en el salón norte (415, 145)</strong>
                  </div>
                  <div class="door-search-how">
                    Lee la carta de amor sobre el escritorio y responde correctamente el cuestionario sobre recuerdos y momentos compartidos.
                  </div>
                </div>
                <div class="door-unlocks-label">
                  🔓 <strong>Qué desbloquea:</strong> Abre el invernadero botánico vidriado y sus orquídeas exóticas.
                </div>
              </div>

              <!-- 5. Cofre del Tesoro (key_1) -->
              <div class="door-guide-card ${hasKey1 ? 'door-unlocked' : ''}">
                <div class="door-guide-header">
                  <div class="door-name-box">
                    <span>💎</span>
                    <strong>Cofre del Tesoro</strong>
                  </div>
                  <span class="door-coord-badge">Cofre: (528, 488)</span>
                  <span class="challenge-status-badge ${hasKey1 ? 'badge-done' : 'badge-pending'}">
                    ${hasKey1 ? '✓ Llave Obtenida' : '🔑 key_1'}
                  </span>
                </div>
                <div class="door-search-box">
                  <div class="door-search-loc">
                    <span>📍 Dónde buscar:</span>
                    <strong>Mesa en el jardín suroeste (240, 740)</strong>
                  </div>
                  <div class="door-search-how">
                    Recoge los 4 fragmentos (${fragmentCount}/4) en Biblioteca (920, 250), Patio Fuente (904, 600), Suite Dosel (105, 150) y Costa (125, 405). Luego ensámblalos en la mesa.
                  </div>
                </div>
                <div class="door-unlocks-label">
                  🔓 <strong>Qué desbloquea:</strong> Abre el cofre sagrado en las ruinas del norte, revelando el Amuleto de Esmeralda.
                </div>
              </div>

              <!-- 6. Puerta Vertical de la Habitación (room_key) -->
              <div class="door-guide-card ${hasRoomKey ? 'door-unlocked' : ''}">
                <div class="door-guide-header">
                  <div class="door-name-box">
                    <span>🗝️</span>
                    <strong>Puerta Vertical de la Habitación</strong>
                  </div>
                  <span class="door-coord-badge">Puerta: (160, 144)</span>
                  <span class="challenge-status-badge ${hasRoomKey ? 'badge-done' : 'badge-pending'}">
                    ${hasRoomKey ? '✓ Llave Obtenida' : '🗝️ room_key'}
                  </span>
                </div>
                <div class="door-search-box">
                  <div class="door-search-loc">
                    <span>📍 Dónde buscar:</span>
                    <strong>Orilla noroeste del estanque (224, 55)</strong>
                  </div>
                  <div class="door-search-how">
                    Camina hacia los juncos junto a la orilla del agua en el extremo noroeste de la finca. La llave está en el suelo; simplemente acércate y pulsa [E] para recogerla.
                  </div>
                </div>
                <div class="door-unlocks-label">
                  🔓 <strong>Qué desbloquea:</strong> Permite ingresar a la habitación privada del ala oeste con balcón al estanque.
                </div>
              </div>

              <!-- 7. Puertas Traseras de Servicio (iron_key) -->
              <div class="door-guide-card ${hasIronKey ? 'door-unlocked' : ''}">
                <div class="door-guide-header">
                  <div class="door-name-box">
                    <span>🚪</span>
                    <strong>Puertas Traseras de Servicio</strong>
                  </div>
                  <span class="door-coord-badge">Puertas: (870, 390)</span>
                  <span class="challenge-status-badge ${hasIronKey ? 'badge-done' : 'badge-pending'}">
                    ${hasIronKey ? '✓ Llave Obtenida' : '🗝️ iron_key'}
                  </span>
                </div>
                <div class="door-search-box">
                  <div class="door-search-loc">
                    <span>📍 Dónde buscar:</span>
                    <strong>Tabla de corte en cocina este (920, 316)</strong>
                  </div>
                  <div class="door-search-how">
                    Entra a la cocina gourmet del este e interactúa con la tabla de madera de corte sobre la encimera para tomar la Llave de Hierro.
                  </div>
                </div>
                <div class="door-unlocks-label">
                  🔓 <strong>Qué desbloquea:</strong> Conecta los pasillos internos de la mansión con los patios traseros.
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

    // Event listeners para cerrar el cartel
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
