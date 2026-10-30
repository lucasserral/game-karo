import type { IMinigame } from './IMinigame.ts';
import type { Player } from '../entities/Player.ts';

/**
 * MinigameManager orchestrates game minigames and controls the sidebar view.
 */
export class MinigameManager {
  private static instance: MinigameManager | null = null;

  private minigames: Map<string, IMinigame> = new Map();
  public activeMinigame: IMinigame | null = null;
  private defaultContainer: HTMLElement | null = null;
  private minigameContainer: HTMLElement | null = null;

  private constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeMinigame) {
        this.closeMinigame();
      }
    });
  }

  public static getInstance(): MinigameManager {
    if (!MinigameManager.instance) {
      MinigameManager.instance = new MinigameManager();
    }
    return MinigameManager.instance;
  }

  public registerMinigame(minigame: IMinigame): void {
    this.minigames.set(minigame.id, minigame);
  }

  public getMinigame(id: string): IMinigame | undefined {
    return this.minigames.get(id);
  }

  public setContainers(defaultEl: HTMLElement, minigameEl: HTMLElement): void {
    this.defaultContainer = defaultEl;
    this.minigameContainer = minigameEl;
  }

  public openMinigame(id: string, player: Player): void {
    const minigame = this.minigames.get(id);
    if (!minigame) {
      console.warn(`Minigame ${id} not found.`);
      return;
    }

    this.activeMinigame = minigame;
    minigame.onInteract(player);

    if (this.defaultContainer) {
      this.defaultContainer.style.display = 'none';
    }
    if (this.minigameContainer) {
      this.minigameContainer.style.display = 'block';
      this.renderActive(player);
    }
  }

  public renderActive(player: Player): void {
    if (!this.minigameContainer || !this.activeMinigame) return;
    this.activeMinigame.renderSidebar(this.minigameContainer, player);
  }

  public closeMinigame(): void {
    if (this.activeMinigame && this.activeMinigame.close) {
      this.activeMinigame.close();
    }
    this.activeMinigame = null;

    if (this.minigameContainer) {
      this.minigameContainer.style.display = 'none';
      this.minigameContainer.innerHTML = '';
    }
    if (this.defaultContainer) {
      this.defaultContainer.style.display = 'block';
    }

    window.dispatchEvent(new CustomEvent('minigame:closed'));
  }

  public isMinigameActive(id?: string): boolean {
    if (!this.activeMinigame) return false;
    if (id) return this.activeMinigame.id === id;
    return true;
  }
}
