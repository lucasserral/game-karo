import type { IMinigame, MinigameState } from '../IMinigame.ts';
import type { Player } from '../../entities/Player.ts';
import { PhotoPuzzleView } from './PhotoPuzzleView.ts';

/**
 * Minigame: Rompecabezas de Foto Dividida en 4 piezas 1:1.
 * Otorga la llave 'key_1' al completarse.
 */
export class PhotoPuzzleMinigame implements IMinigame {
  public readonly id = 'photo_puzzle';
  public readonly title = 'La Foto Misteriosa';
  public state: MinigameState = 'not_started';
  public isRewardClaimed = false;

  private view: PhotoPuzzleView;

  constructor(photoUrl = '/game1/assets/photo.png') {
    this.view = new PhotoPuzzleView(this, photoUrl);
  }

  public onInteract(player: Player): void {
    if (this.isRewardClaimed) {
      this.state = 'completed';
      return;
    }

    if (player.hasAllPhotoFragments()) {
      this.state = 'ready_to_solve';
      // Si el jugador interactúa teniendo todos los pedazos, completar y otorgar recompensa
      this.rewardPlayer(player);
    } else if (player.photoFragments.size > 0) {
      this.state = 'in_progress';
    } else {
      this.state = 'not_started';
    }
  }

  public renderSidebar(container: HTMLElement, player: Player): void {
    this.view.render(container, player);
  }

  public isComplete(): boolean {
    return this.isRewardClaimed;
  }

  public rewardPlayer(player: Player): void {
    if (this.isRewardClaimed) return;

    this.isRewardClaimed = true;
    this.state = 'completed';
    player.addKey('key_1');
    player.setNotification('🎉 ¡Foto restaurada! Obtuviste la llave key_1.', 4.5);
  }
}
