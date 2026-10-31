import type { IMinigame, MinigameState } from '../IMinigame.ts';
import type { Player } from '../../entities/Player.ts';
import { MemoryView } from './MemoryView.ts';

export interface MemoryCard {
  id: number;
  symbol: string;
  name: string;
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

/**
 * MemoryMinigame: Juego de memoria con cartas boca abajo en (970, 370).
 * El jugador voltea 2 cartas por turno para encontrar parejas iguales.
 * Al completar todas las parejas, se desbloquea la llave 'key_4'.
 */
export class MemoryMinigame implements IMinigame {
  public readonly id = 'memory_minigame';
  public readonly title = 'Juego de Memoria';
  public state: MinigameState = 'not_started';
  public isRewardClaimed = false;

  public cards: MemoryCard[] = [];
  public flippedCardIndices: number[] = [];
  public matchedPairsCount = 0;
  public totalPairs = 8;
  public movesCount = 0;

  // Símbolos temáticos para las 8 parejas
  private readonly symbolsData = [
    { symbol: '❤️', name: 'Corazón' },
    { symbol: '⭐', name: 'Estrella' },
    { symbol: '💎', name: 'Diamante' },
    { symbol: '🗝️', name: 'Llave' },
    { symbol: '👑', name: 'Corona' },
    { symbol: '🌸', name: 'Flor de Loto' },
    { symbol: '🔮', name: 'Orbe Mágico' },
    { symbol: '🌙', name: 'Luna de Plata' },
  ];

  private view: MemoryView;

  constructor() {
    this.view = new MemoryView(this);
    this.initializeDeck();
  }

  public initializeDeck(): void {
    const deck: MemoryCard[] = [];
    let idCounter = 0;

    this.symbolsData.forEach((item, pairIndex) => {
      // 2 cartas por cada símbolo
      for (let i = 0; i < 2; i++) {
        deck.push({
          id: idCounter++,
          symbol: item.symbol,
          name: item.name,
          pairId: pairIndex,
          isFlipped: false,
          isMatched: false,
        });
      }
    });

    // Barajado Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }

    this.cards = deck;
    this.flippedCardIndices = [];
    this.matchedPairsCount = 0;
    this.movesCount = 0;
    this.totalPairs = this.symbolsData.length;
  }

  public onInteract(player: Player): void {
    if (this.isRewardClaimed || player.hasKey('key_4')) {
      this.isRewardClaimed = true;
      this.state = 'completed';
    } else if (this.matchedPairsCount > 0) {
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
    player.addKey('key_4');
    player.setNotification('🎉 ¡Juego de memoria completado! Has obtenido la llave key_4.', 5.0);
  }

  public restartGame(): void {
    this.initializeDeck();
    if (!this.isRewardClaimed) {
      this.state = 'not_started';
    }
  }
}
