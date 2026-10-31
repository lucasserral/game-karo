import type { IMinigame, MinigameState } from '../IMinigame.ts';
import type { Player } from '../../entities/Player.ts';
import { WelcomeSignView } from './WelcomeSignView.ts';

/**
 * WelcomeSignMinigame: Cartel y nota interactiva en la entrada de la finca (340, 945).
 * Explica el objetivo del juego (encontrar a Karolina), instrucciones y da la pista inicial
 * de que la primera llave para abrir las puertas de la mansión se consigue pescando en el lago.
 */
export class WelcomeSignMinigame implements IMinigame {
  public readonly id = 'welcome_sign';
  public readonly title = 'Cartel de la Entrada';
  public state: MinigameState = 'completed';
  private view: WelcomeSignView;

  constructor() {
    this.view = new WelcomeSignView(this);
  }

  public onInteract(_player: Player): void {
    this.state = 'completed';
  }

  public renderSidebar(container: HTMLElement, player: Player): void {
    this.view.render(container, player);
  }

  public isComplete(): boolean {
    return true;
  }

  public rewardPlayer(_player: Player): void {
    // Es un cartel informativo/guía con pista, no otorga llave directamente
  }

  public close(): void {
    this.view.cleanup();
  }
}
