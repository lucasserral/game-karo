import type { IMinigame, MinigameState } from '../IMinigame.ts';
import type { Player } from '../../entities/Player.ts';
import { FishingView } from './FishingView.ts';

export interface CatchItem {
  type: 'fish' | 'bottle' | 'key';
  name: string;
  icon: string;
  detail: string;
  rarity: 'común' | 'raro' | 'legendario';
}

/**
 * FishingMinigame: Minijuego de pesca de reflejos en el muelle (1272, 343).
 * El jugador observa el agua y la boya. Cuando la boya se hunde con un chapoteo,
 * debe hacer click a tiempo para pescar peces, botellas con mensaje o la llave 'key_2'.
 */
export class FishingMinigame implements IMinigame {
  public readonly id = 'fishing_minigame';
  public readonly title = 'Pesca en el Muelle';
  public state: MinigameState = 'in_progress';

  private view: FishingView;
  private consecutiveCatchesWithoutKey = 0;

  constructor() {
    this.view = new FishingView(this);
  }

  public onInteract(_player: Player): void {
    this.state = 'in_progress';
  }

  public renderSidebar(container: HTMLElement, player: Player): void {
    this.view.render(container, player);
  }

  public isComplete(): boolean {
    return false; // El minijuego de pesca es rejugable infinitamente
  }

  public rewardPlayer(_player: Player): void {
    // Manejado por generateCatch()
  }

  public close(): void {
    this.view.cleanup();
  }

  /**
   * Genera una captura aleatoria basada en las condiciones del jugador.
   */
  public generateCatch(player: Player): CatchItem {
    const hasKey2 = player.hasKey('key_2');

    // Si aún no tiene la llave key_2:
    // 40% de probabilidad normal, o 100% si ya pescó 2 veces sin obtenerla
    if (!hasKey2 && (this.consecutiveCatchesWithoutKey >= 2 || Math.random() < 0.45)) {
      this.consecutiveCatchesWithoutKey = 0;
      const keyCatch: CatchItem = {
        type: 'key',
        name: 'Llave Marina Antigua (key_2)',
        icon: '🗝️',
        detail: 'Una llave de bronce con grabados náuticos y pátina de algas marinas rescatada de las profundidades del estanque.',
        rarity: 'legendario',
      };
      player.addFishingCatch(keyCatch);
      player.setNotification('🎉 ¡Increíble! Pescaste la llave key_2 del fondo del lago.', 5.0);
      return keyCatch;
    }

    if (!hasKey2) {
      this.consecutiveCatchesWithoutKey++;
    }

    // 35% de botellas con mensaje, 65% de pescados
    if (Math.random() < 0.35) {
      const bottleOptions: CatchItem[] = [
        {
          type: 'bottle',
          name: 'Botella con Mapa del Tesoro',
          icon: '📜',
          detail: '"La nota en el interior reza: \'Tres llaves abren las reliquias de la finca: la del estudio, la del retrato y la del muelle...\'"',
          rarity: 'raro',
        },
        {
          type: 'bottle',
          name: 'Botella con Poema del Navegante',
          icon: '🍾',
          detail: '"Verso en pergamino: \'Bajo la sombra del sauce, donde el agua toca el puente de madera, los peces guardan secretos centenarios...\'"',
          rarity: 'común',
        },
        {
          type: 'bottle',
          name: 'Frasco con Deseo Antiguo',
          icon: '✨',
          detail: '"\'Que las aguas de Karo traigan fortuna a todo explorador que sepa aguardar con paciencia el instante preciso...\'"',
          rarity: 'raro',
        },
      ];
      const bottle = bottleOptions[Math.floor(Math.random() * bottleOptions.length)];
      player.addFishingCatch(bottle);
      player.setNotification(`📜 ¡Pescaste una ${bottle.name}!`, 3.5);
      return bottle;
    }

    const fishOptions: CatchItem[] = [
      {
        type: 'fish',
        name: 'Carpa Dorada de Karo',
        icon: '🐠',
        detail: 'Un hermoso pez de escamas doradas brillantes que nada en aguas tranquilas.',
        rarity: 'raro',
      },
      {
        type: 'fish',
        name: 'Trucha Arcoíris del Estanque',
        icon: '🐟',
        detail: 'Pez ágil y vivaz con reflejos púrpuras y plateados.',
        rarity: 'común',
      },
      {
        type: 'fish',
        name: 'Salmón Plateado Real',
        icon: '🐟',
        detail: 'Un ejemplar robusto de vientre perlado y nado vigoroso.',
        rarity: 'común',
      },
      {
        type: 'fish',
        name: 'Pez Ángel del Lago Secreto',
        icon: '🐡',
        detail: 'Un exótico espécimen de aletas sedosas y ojos luminosos.',
        rarity: 'raro',
      },
    ];

    const fish = fishOptions[Math.floor(Math.random() * fishOptions.length)];
    player.addFishingCatch(fish);
    player.setNotification(`🎣 ¡Has pescado un ejemplar de ${fish.name}!`, 3.5);
    return fish;
  }
}
