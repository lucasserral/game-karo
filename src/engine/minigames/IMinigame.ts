import type { Player } from '../entities/Player.ts';

export type MinigameState = 'not_started' | 'in_progress' | 'ready_to_solve' | 'completed';

/**
 * Interface standard for in-game minigames.
 */
export interface IMinigame {
  readonly id: string;
  readonly title: string;
  state: MinigameState;

  onInteract(player: Player): void;
  renderSidebar(container: HTMLElement, player: Player): void;
  isComplete(): boolean;
  rewardPlayer(player: Player): void;
  close?(): void;
}
