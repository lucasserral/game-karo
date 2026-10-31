import type { IMinigame, MinigameState } from '../IMinigame.ts';
import type { Player } from '../../entities/Player.ts';
import { SimonPlatesView } from './SimonPlatesView.ts';

export type PlateColor = 'red' | 'blue' | 'green' | 'yellow';

export interface PlateInfo {
  id: PlateColor;
  name: string;
  icon: string;
  hex: string;
  glow: string;
  freq: number;
}

export const PLATES_INFO: Record<PlateColor, PlateInfo> = {
  red: {
    id: 'red',
    name: 'Plato Rubí',
    icon: '🔴',
    hex: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.75)',
    freq: 261.63, // Do (C4)
  },
  blue: {
    id: 'blue',
    name: 'Plato Zafiro',
    icon: '🔵',
    hex: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.75)',
    freq: 329.63, // Mi (E4)
  },
  green: {
    id: 'green',
    name: 'Plato Esmeralda',
    icon: '🟢',
    hex: '#10b981',
    glow: 'rgba(16, 185, 129, 0.75)',
    freq: 392.0, // Sol (G4)
  },
  yellow: {
    id: 'yellow',
    name: 'Plato Ámbar',
    icon: '🟡',
    hex: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.75)',
    freq: 523.25, // Do agudo (C5)
  },
};

/**
 * SimonPlatesMinigame: Minijuego de memoria secuencial en (80, 400).
 * El jugador debe memorizar y repetir la secuencia de platos de colores / notas musicales.
 * Cada ronda agrega un nuevo plato a la secuencia. Al completar 5 rondas, obtiene 'key_5'.
 */
export class SimonPlatesMinigame implements IMinigame {
  public readonly id = 'simon_plates';
  public readonly title = 'Secuencia de Platos';
  public state: MinigameState = 'not_started';
  public isRewardClaimed = false;

  public fullSequence: PlateColor[] = [];
  public currentRound = 1;
  public readonly totalRounds = 16;
  public playerStep = 0;

  private view: SimonPlatesView;

  constructor() {
    this.view = new SimonPlatesView(this);
    this.generateNewGame();
  }

  public generateNewGame(): void {
    const colors: PlateColor[] = ['red', 'blue', 'green', 'yellow'];
    this.fullSequence = [];
    for (let i = 0; i < this.totalRounds; i++) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      this.fullSequence.push(randomColor);
    }
    this.currentRound = 1;
    this.playerStep = 0;
  }

  public getCurrentSequence(): PlateColor[] {
    return this.fullSequence.slice(0, this.currentRound);
  }

  public onInteract(player: Player): void {
    if (this.isRewardClaimed || player.hasKey('key_5')) {
      this.isRewardClaimed = true;
      this.state = 'completed';
    } else if (this.currentRound > 1) {
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

  public checkPlayerInput(color: PlateColor, player: Player): {
    correct: boolean;
    roundComplete: boolean;
    gameWon: boolean;
  } {
    const currentSeq = this.getCurrentSequence();
    const expected = currentSeq[this.playerStep];

    if (color === expected) {
      this.playerStep++;
      if (this.playerStep >= currentSeq.length) {
        // Ronda completada con éxito
        if (this.currentRound >= this.totalRounds) {
          // ¡Juego ganado!
          this.rewardPlayer(player);
          return { correct: true, roundComplete: true, gameWon: true };
        } else {
          this.currentRound++;
          this.playerStep = 0;
          return { correct: true, roundComplete: true, gameWon: false };
        }
      }
      return { correct: true, roundComplete: false, gameWon: false };
    } else {
      // Error: Reiniciar intento en esta ronda
      this.playerStep = 0;
      return { correct: false, roundComplete: false, gameWon: false };
    }
  }

  public rewardPlayer(player: Player): void {
    if (this.isRewardClaimed) return;
    this.isRewardClaimed = true;
    this.state = 'completed';
    player.addKey('key_5');
    player.setNotification('🎉 ¡Secuencia completada! Has obtenido la llave key_5.', 5.0);
  }

  public restartGame(): void {
    this.generateNewGame();
    if (!this.isRewardClaimed) {
      this.state = 'not_started';
    }
  }

  public close(): void {
    this.view.cleanup();
  }
}
