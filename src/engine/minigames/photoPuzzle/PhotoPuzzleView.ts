import type { Player } from '../../entities/Player.ts';
import type { PhotoPuzzleMinigame } from './PhotoPuzzleMinigame.ts';
import { MinigameManager } from '../MinigameManager.ts';

/**
 * Renders the vintage sheet of paper ("hoja") in the sidebar with the 1:1 photo puzzle.
 */
export class PhotoPuzzleView {
  private minigame: PhotoPuzzleMinigame;
  private photoUrl: string;

  constructor(minigame: PhotoPuzzleMinigame, photoUrl = '/game1/assets/photo.png') {
    this.minigame = minigame;
    this.photoUrl = photoUrl;
  }

  public render(container: HTMLElement, player: Player): void {
    const isCompleted = this.minigame.isRewardClaimed;
    const piecesFound = player.photoFragments.size;
    const hasAll = player.hasAllPhotoFragments();

    const piece1Unlocked = player.hasPhotoFragment(1);
    const piece2Unlocked = player.hasPhotoFragment(2);
    const piece3Unlocked = player.hasPhotoFragment(3);
    const piece4Unlocked = player.hasPhotoFragment(4);

    container.innerHTML = `
      <div class="parchment-sheet-wrapper">
        <div class="parchment-sheet ${isCompleted ? 'completed-glow' : ''}">
          <!-- Pushpin decor -->
          <div class="parchment-pin" title="Fijado en la mesa">📌</div>

          <!-- Header & Close -->
          <div class="parchment-header">
            <span class="parchment-tag">Nota de la Mesa • (240, 740)</span>
            <button class="parchment-close-btn" id="btn-close-parchment" title="Cerrar nota" aria-label="Cerrar nota">✕</button>
          </div>

          <!-- Handwritten Note Content -->
          <div class="parchment-body">
            <p class="parchment-handwriting">
              "Para obtener una llave necesitas completar la foto con 4 pedacitos de fotos repartidas por el mapa. Encuentralas"
            </p>

            <!-- 1:1 Photo Frame & Puzzle Grid -->
            <div class="parchment-photo-frame ${isCompleted ? 'is-complete' : ''}">
              <div class="photo-puzzle-grid ${isCompleted ? 'grid-merged' : ''}">
                <!-- Cuadrante 1: Sup-Izq -->
                <div class="photo-piece piece-1 ${piece1Unlocked || isCompleted ? 'unlocked' : 'locked'}"
                     style="${piece1Unlocked || isCompleted ? `background-image: url('${this.photoUrl}');` : ''}">
                  ${!piece1Unlocked && !isCompleted ? '<span class="piece-lock-icon">1</span>' : ''}
                </div>

                <!-- Cuadrante 2: Sup-Der -->
                <div class="photo-piece piece-2 ${piece2Unlocked || isCompleted ? 'unlocked' : 'locked'}"
                     style="${piece2Unlocked || isCompleted ? `background-image: url('${this.photoUrl}');` : ''}">
                  ${!piece2Unlocked && !isCompleted ? '<span class="piece-lock-icon">2</span>' : ''}
                </div>

                <!-- Cuadrante 3: Inf-Izq -->
                <div class="photo-piece piece-3 ${piece3Unlocked || isCompleted ? 'unlocked' : 'locked'}"
                     style="${piece3Unlocked || isCompleted ? `background-image: url('${this.photoUrl}');` : ''}">
                  ${!piece3Unlocked && !isCompleted ? '<span class="piece-lock-icon">3</span>' : ''}
                </div>

                <!-- Cuadrante 4: Inf-Der -->
                <div class="photo-piece piece-4 ${piece4Unlocked || isCompleted ? 'unlocked' : 'locked'}"
                     style="${piece4Unlocked || isCompleted ? `background-image: url('${this.photoUrl}');` : ''}">
                  ${!piece4Unlocked && !isCompleted ? '<span class="piece-lock-icon">4</span>' : ''}
                </div>
              </div>

              ${isCompleted ? '<div class="photo-stamp">COMPLETADA</div>' : ''}
            </div>

            <!-- Status Banner -->
            <div class="parchment-status">
              <div class="status-meter">
                <span class="status-text">Pedacitos: <strong>${piecesFound} / 4</strong></span>
                <div class="meter-bar">
                  <div class="meter-fill" style="width: ${(piecesFound / 4) * 100}%;"></div>
                </div>
              </div>

              ${
                isCompleted
                  ? `
                <div class="reward-banner">
                  <span class="reward-icon">🗝️</span>
                  <div class="reward-text">
                    <strong>¡Recompensa Obtenida!</strong>
                    <span>Has recibido la llave <code>key_1</code>.</span>
                  </div>
                </div>
              `
                  : hasAll
                    ? `
                <button class="btn-assemble-photo" id="btn-assemble-photo">
                  ✨ ¡Armar Foto y Obtener Llave!
                </button>
              `
                    : `
                <p class="parchment-hint">
                  Explora las habitaciones, la fuente, los dormitorios y la costa para encontrar los pedazos faltantes.
                </p>
              `
              }

              ${
                !isCompleted
                  ? `
                <button class="btn-debug-skip" id="btn-debug-key1" title="Modo Debugging: Obtener llave key_1">
                  ⚡ [Debug: Obtener Llave key_1]
                </button>
              `
                  : ''
              }
            </div>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const btnClose = container.querySelector('#btn-close-parchment');
    btnClose?.addEventListener('click', () => {
      MinigameManager.getInstance().closeMinigame();
    });

    const btnDebug = container.querySelector('#btn-debug-key1');
    btnDebug?.addEventListener('click', () => {
      player.photoFragments.add(1);
      player.photoFragments.add(2);
      player.photoFragments.add(3);
      player.photoFragments.add(4);
      this.minigame.rewardPlayer(player);
      this.render(container, player);
    });

    const btnAssemble = container.querySelector('#btn-assemble-photo');
    btnAssemble?.addEventListener('click', () => {
      this.minigame.rewardPlayer(player);
      this.render(container, player);
    });
  }
}
